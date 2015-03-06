(function(factory) {
	if (typeof define === "function" && define.amd) {
		// AMD. Register as an anonymous module.
		define([
			"jquery"
		], factory);
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function($) {
	var PROP_NAME = "lightcalendar";

	function LightCalendar(containerManager) {

		this.regional = []; // Available regional settings, indexed by language code
		this.regional[""] = { // Default regional settings
			monthNames: ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"
			], // Names of months for formatting
			monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // For formatting
			dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], // For formatting
			dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], // For formatting
			dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], // Column headings for days starting at Sunday
			weekHeader: "Wk", // Column header for week of the year
			dateFormat: "mm/dd/yy", // See format options on parseDate
			firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
		};

		this._defaults = { // Global defaults for all the date picker instances
			showOn: "focus", // "focus" for popup on focus,
			showAnim: "fadeIn", // Name of jQuery animation for popup
			duration: "fast", // Duration of display/closure
			defaultDate: null, // Used when field is blank: actual date,
			// +/-number for offset from today, null for today
			onSelect: null, // Define a callback function when a date is selected
			onClose: null // Define a callback function when the datepicker is closed
		};

		$.extend(this._defaults, this.regional[""]);

		this.render = new CalendarRender(this._defaults);
		this._containerManager = new CalendarContainerManager(this.render, this._defaults);


	}

	$.extend(LightCalendar.prototype, {

	});

	/*
		CalendarContainerManager - manage state of calendar
	*/
	function CalendarContainerManager(render, settings) {
		this.curInst = null; // The current instance in use

		this.initialized = false;
		this.calendarID = "light-calendar-container";
		this.container = $('<div id="' + this.calendarID + '" class="l-calendar">This is Calendar<div>');
		this.calendarShowing = false;
		this.lastInput = null;
		this.defaultSettings = settings;

		this.render = render;
	}

	$.extend(CalendarContainerManager.prototype, {
		markerClassName: "hasCalendar",

		/* Close date picker if clicked elsewhere. */
		checkExternalClick: function(event) {
			if (!this.curInst) {
				return;
			}

			var $target = $(event.target);
			var inst = this.getInst($target[0]);

			this.hideCalendar();
		},

		init: function(widgets, options) {
			var that = this;
			if (!this.initialized) {
				$(document).mousedown(function(event) {
					that.checkExternalClick(event);
				});
			}

			if ($("#" + this.calendarID).length === 0) {
				$("body").append(this.container);
			}

			return widgets.each(function() {
				that.attachCalendar(this, options);
			});
		},

		attachCalendar: function(target, settings) {
			var nodeName = target.nodeName.toLowerCase();
			var inline = (nodeName === 'div' || nodeName === 'span');

			var inst = this.newInst($(target), inline);
			inst.settings = $.extend({}, settings || {});
			if (nodeName === 'input') {
				this.connectCalendar(target, inst);
			} else if (inline) {
				// this._inlineCalendar(target, inst);
			}
		},

		connectCalendar: function(target, inst) {
			var input = $(target);

			if (input.hasClass(this.markerClassName)) {
				return;
			}

			this.bindCalendarInstance(input, inst);
			input.addClass(this.markerClassName);
			$.data(target, PROP_NAME, inst);
		},

		bindCalendarInstance: function(input, inst) {
			var that = this;
			var showCalendarHander = function(event) {
				that.showCalendar(event);
			}

			input.unbind("focus", showCalendarHander);

			input.focus(showCalendarHander);

		},

		showCalendar: function(input) {
			input = input.target || input;

			if (this.lastInput === input) {
				return;
			}

			var inst = this.getInst(input);

			var isOtherInstance = this.curInst && this.curInst !== inst;
			var prevCalendarIsShowing = inst && this.calendarShowing;
			if (isOtherInstance && prevCalendarIsShowing) {
				this.hideCalendar(this.curInst.input[0]);
			}

			this.lastInput = input;
			if (!this._pos) { // position below input
				this._pos = this.findPos(input);
				this._pos[1] += input.offsetHeight; // add the height
			}

			this.render.update(inst);

			var offset = {
				left: this._pos[0],
				top: this._pos[1]
			};

			this._pos = null;

			inst.container.css({
				position: "absolute",
				display: "none",
				left: offset.left + "px",
				top: offset.top + "px"
			});

			if (!inst.inline) {
				showAnim = this.get(inst, "showAnim");
				duration = this.get(inst, "duration");
				inst.container.css("z-index", 1000);
				this.calendarShowing = true;

				if ($.effects && $.effects.effect[showAnim]) {
					inst.container.show(showAnim, this.get(inst, "showOptions"), duration);
				} else {
					inst.container[showAnim || "show"](showAnim ? duration : null);
				}

				if (inst.input.is(":visible") && !inst.input.is(":disabled")) {
					inst.input.focus();
				}

				this.curInst = inst;
			}

		},

		hideCalendar: function(input) {
			var inst = this.curInst;
			if (!inst || (input && inst !== $.data(input, PROP_NAME))) {
				return;
			}

			if (this.calendarShowing) {
				var showAnim = this.get(inst, "showAnim");
				var duration = this.get(inst, "duration");

				if ($.effects && ($.effects.effect[showAnim] || $.effects[showAnim])) {
					inst.container.hide(showAnim, this.get(inst, "showOptions"), duration);
				} else {
					inst.container[(showAnim === "slideDown" ? "slideUp" :
						(showAnim === "fadeIn" ? "fadeOut" : "hide"))]((showAnim ? duration : null));
				}

				this.calendarShowing = false;
				this.lastInput = null;
			}
		},

		/* Find an object's position on the screen. */
		findPos: function(obj) {
			var position,
				inst = this.getInst(obj);

			while (obj && (obj.type === "hidden" || obj.nodeType !== 1 || $.expr.filters.hidden(obj))) {
				obj = obj["nextSibling"];
			}

			position = $(obj).offset();
			return [position.left, position.top];
		},

		//utils functions
		newInst: function(target, inline) {
			var id = target[0].id;
			return {
				id: id,
				input: target,
				inline: inline,
				container: this.container
			};
		},

		getInst: function(target) {
			try {
				return $.data(target, PROP_NAME);
			} catch (err) {
				throw "Missing instance data for this datepicker";
			}
		},

		/* Get a setting value, defaulting if necessary. */
		get: function(inst, name) {
			return inst.settings[name] !== undefined ?
				inst.settings[name] : this.defaultSettings[name];
		},
	});

	/* Calendar Render*/
	function CalendarRender(settings) {
		this.settings = settings;
	}

	$.extend(CalendarRender.prototype, {
		update: function(inst) {
			inst.container.empty().append(this.generateHTML(inst));
			// this.attachHandlers(inst);
		},

		generateHTML: function(inst) {
			var that = this;
			var headerTemplate = '<div class="l-header"> <%this.selectedMonth%> </div>';
			var header = TemplateEngine(headerTemplate, {
				selectedMonth: "March"
			});

			var contentTemplate = 
			'<%for(var index in this.days) {%>'+
				'<th><%this.days[index]%></th>' +
			'<%}%>';

			var daysHeader = TemplateEngine(contentTemplate, {
				days: that.settings.dayNamesMin
			})

			htmlTemplate = '<%this.header%>' +
								'<table class="scroll">' + 
									'<thead>'+
										'<tr>' +
											'<%this.days%>' +
										'</tr>'+
									'</thead>' +
								'</table>';
			
			var html = TemplateEngine(htmlTemplate, {
				header: header,
				days: daysHeader
			});

			return html;
		}

	});

	//lite weight template engine
	var TemplateEngine = function(html, options) {
		var re = /<%([^%>]+)?%>/g,
			reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
			code = 'var r=[];\n',
			cursor = 0,
			match;
		var add = function(line, js) {
			js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
				(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
			return add;
		}
		while (match = re.exec(html)) {
			add(html.slice(cursor, match.index))(match[1], true);
			cursor = match.index + match[0].length;
		}
		add(html.substr(cursor, html.length - cursor));
		code += 'return r.join("");';
		return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
	}

	/* Invoke the calendar functionality.*/
	$.fn.lightcalendar = function(options) {
		return $.lightcalendar._containerManager.init(this, options);
	};

	$.lightcalendar = new LightCalendar(); // singleton instance
	// $.lightcalendar.initialized = false;
	$.lightcalendar.uuid = new Date().getTime();
}));