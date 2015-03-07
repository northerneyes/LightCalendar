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
	var CELLSELECTOR = "td:has(.l-link)";

	var MS_PER_DAY = 86400000;
	var MAX_DAYS = 180;

	function InstanceManager(container, defaultOptions) {
		this.curInst = null; // The current instance in use
		this.defaultOptions = defaultOptions;
		this.container = container;
	}

	$.extend(InstanceManager.prototype, {
		init: function(elements, options) {
			var that = this;
			elements.each(function() {
				that.create(this, options);
			});
		},

		create: function(target, options) {
			var nodeName = target.nodeName.toLowerCase();
			var inst = this.new($(target));
			inst.options = $.extend({}, options || {});

			$.data(target, PROP_NAME, inst);
		},

		new: function(target) {
			var id = target[0].id;
			return {
				id: id,
				input: target,
				container: this.container
			};
		},

		setCurrent: function(inst) {
			this.curInst = inst;
		},

		getCurrent: function() {
			return this.curInst;
		},

		compare: function(inst) {
			return this.curInst === inst;
		},

		get: function(target) {
			try {
				return $.data(target, PROP_NAME);
			} catch (err) {
				throw "Missing instance data for this calendar";
			}
		},

		options: function(inst, name) {
			return inst.options[name] !== undefined ?
				inst.options[name] : this.defaultOptions[name];
		}
	});

	//Popup manager
	function PopupManager(container, instanceManager) {
		var that = this;

		this.instanceManager = instanceManager;
		this.container = container;
		this.popupID = "light-popup-container";
		this.popupShowing = false;
		this.lastElement = null;

		this.container.attr('id', this.popupID);

	}

	$.extend(PopupManager.prototype, {
		init: function(elements) {
			var that = this;

			if ($("#" + this.popupID).length === 0) {
				$("body").append(this.container);
			}
		},

		close: function() {
			var inst = this.instanceManager.getCurrent();

			if (!inst) {
				return;
			}

			if (this.popupShowing) {
				var showAnim = this.instanceManager.options(inst, "showAnim");
				var duration = this.instanceManager.options(inst, "duration");

				inst.container[(showAnim === "slideDown" ? "slideUp" :
					(showAnim === "fadeIn" ? "fadeOut" : "hide"))]((showAnim ? duration : null));

				this.popupShowing = false;
				this.lastElement = null;
			}

		},

		open: function(element) {
			if (this.lastElement === element) {
				return;
			}

			var inst = this.instanceManager.get(element);
			var isOtherInstance = !this.instanceManager.compare(inst);
			var prevCalendarIsShowing = inst && this.popupShowing;
			if (isOtherInstance && prevCalendarIsShowing) {
				this.close(this.instanceManager.getCurrent().input[0]);
			}

			this.lastElement = element;
			if (!this._pos) { // position below input
				this._pos = this._findPos(element);
				this._pos[1] += element.offsetHeight; // add the height
			}

			var offset = {
				left: this._pos[0],
				top: this._pos[1]
			};

			this._pos = null;



			var showAnim = this.instanceManager.options(inst, "showAnim");
			var duration = this.instanceManager.options(inst, "duration");
			inst.container.css({
				position: "absolute",
				display: "none",
				left: offset.left + "px",
				top: offset.top + "px",
				"z-index": 1000
			});

			inst.container[showAnim || "show"](showAnim ? duration : null);

			this.popupShowing = true;
			this.instanceManager.setCurrent(inst);

		},
		isPopup: function($target) {
			return $target.parents('#' + this.popupID).length > 0;
		},
		_findPos: function(obj) {
			var position,
				inst = this.instanceManager.get(obj);

			while (obj && (obj.type === "hidden" || obj.nodeType !== 1 || $.expr.filters.hidden(obj))) {
				obj = obj["nextSibling"];
			}

			position = $(obj).offset();
			return [position.left, position.top];
		}
	});


	function Calendar(container, instanceManager) {
		var that = this;
		that._instanceManager = instanceManager;
		that._container = container;
		that.listener = [];


		that.cellTemplate = template('<td <%= cssClass %> title="<%= title %>"><% if(monthName !== "") { %><span> <%= monthName %> </span> <%}%><a tabindex="-1" class="l-link" href="\\#" data-value="<%= dateString %>"> <%= value %> </a></td>');
		that.headerTemplate = template('<div class="l-header"><%= month%></div>')
	}


	$.extend(Calendar.prototype, {
		update: function(element) {
			var inst = this._instanceManager.get(element);
			this._container.unbind();
			this._container.empty().append(this._generateHTML(inst));
			this._attachHandlers(inst);
		},
		_generateHTML: function(inst) {
			inst.options.content = this.cellTemplate;
			inst.options.date = inst.date;
			$.extend(inst.options, {
				content: this.cellTemplate,
				date: inst.date,
				weekends: this._instanceManager.options(inst, "weekends"),
				holidays: this._instanceManager.options(inst, "holidays"),
				maxDays: this._instanceManager.options(inst, "maxDays"),
				leadingRows: this._instanceManager.options(inst, "leadingRows"),
				dayNames: this._instanceManager.options(inst, "dayNames"),
				dayNamesMin: this._instanceManager.options(inst, "dayNamesMin"),
				monthNamesShort: this._instanceManager.options(inst, "monthNamesShort"),
				monthNames: this._instanceManager.options(inst, "monthNames")
			});
			inst.options.holidays = this._convertHolydays(inst.options.holidays);
			var contentHtml = calendar.content(inst.options);
			var header = calendar.title(inst.date || new Date(), inst.options);
			var headerHtml = this.headerTemplate({
				month: header.toUpperCase()
			});

			return headerHtml + contentHtml;
		},

		_convertHolydays: function(holidays) {
			if (holidays.length === 0 || $.isNumeric(holidays[0])) {
				return holidays;
			}
			temp = [];
			$.each(holidays, function(index, item) {
				temp.push(calendar.normalize(item).getTime());
			});
			return temp;
		},

		register: function(listener) {
			this.listener.push(listener);
		},

		emit: function(eventName, args) {
			$.each(this.listener, function(index, listener) {
				if (listener[eventName]) {
					listener[eventName].apply(this, args);
				}
			});
		},

		_attachHandlers: function(inst) {
			var that = this;
			this._container.on('click', CELLSELECTOR, function(e) {
				var $link = $(e.currentTarget).find('.l-link');
				if ($(e.currentTarget).hasClass('l-disable') && $link.length) {
					e.preventDefault();
					return;
				}

				that._click($link, inst);
			});
		},

		_click: function($link, inst) {
			var value = $link.data('value').split("-");

			value = new Date(value[0], value[1], value[2]);

			this.emit("change", [value, inst]);
		},

		scrollToSelectedDate: function() {
			var $selected = this._container.find('.l-state-selected');
			if ($selected.length) {

				var $gridContent = this._container.find('.l-grid-content');
				var selectedPos = $selected.offset().top;
				var gridContentPos = $gridContent.offset().top;
				$gridContent.animate({
					scrollTop: selectedPos - gridContentPos - 60
				}, 0, function() {});
			}

		},

		format: function(date) {
			var pad = calendar.pad;
			return pad(date.getDate()) + "-" + pad(date.getMonth() + 1) + "-" + date.getFullYear();
		},

		_pad: function(n) {
			return (n < 10) ? ("0" + n) : n;
		}
	});

	//render logic
	var calendar = {
		name: 'MONTH',
		title: function(date, options) {
			return options.monthNames[date.getMonth()] + " " + date.getFullYear();
		},
		content: function(options) {
			var that = this,
				idx = 0,
				selectedDate = options.date,
				holidays = options.holidays,
				weekends = options.weekends,
				names = options.dayNames,
				shortNames = options.dayNamesMin,
				monthShort = options.monthNamesShort,
				maxDays = options.maxDays,
				leadingRows = options.leadingRows,
				monthNames = options.monthNames,

				title = that.formatTitle,
				pad = that.pad,
				start = that.firstVisibleDay(leadingRows),
				toDateString = that.toDateString,
				normalize = that.normalize,
				today = new Date(),
				html = '<div class="l-grid-header"><table tabindex="0" class="l-grid" cellspacing="0"><thead><tr>';

			for (; idx < 7; idx++) {
				var className = "";
				var weekDayIndex = idx === 6 ? 0 : idx + 1;
				if (weekends.indexOf(weekDayIndex) !== -1) {
					className = "l-disable";
				}
				html += '<th scope="col" title="' + names[idx] + '" class="' + className + '">' + shortNames[idx] + '</th>';
			}

			today = new Date(today.getFullYear(), today.getMonth(), today.getDate()); //only date

			return view({
				cells: maxDays,
				perRow: 7,
				html: html += '</tr></thead><tbody><tr></tr></tbody></table></div> <div class="l-grid-content"><table tabindex="0" class="l-content" cellspacing="0"><tr>',
				start: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
				content: options.content, //cell render
				setter: that.setDate,
				build: function(date) {
					var cssClass = [],
						day = date.getDay(),
						monthName = "";

					if (date.getTime() === normalize(today).getTime()) {

						cssClass.push("l-today");
					}

					if (weekends.indexOf(day) !== -1) {
						cssClass.push("l-weekend");
						cssClass.push("l-disable");
					}

					if (holidays.length > 0) {
						if (holidays.indexOf(date.getTime()) !== -1) {
							cssClass.push("l-holyday");
							cssClass.push("l-disable");
						}
					}

					if (date < today) {
						cssClass.push("l-disable");
					}

					if (selectedDate) {
						var select = normalize(selectedDate);
						if (select.getTime() === date.getTime()) {
							cssClass.push("l-state-selected");
						}
					}

					if (date.getDate() === 1) {
						monthName = monthShort[date.getMonth()];
						cssClass.push("l-start-month");
					}

					return {
						date: date,
						monthName: monthName.toUpperCase(),
						title: title(date, monthNames, names, pad),
						value: date.getDate(),
						dateString: toDateString(date),
						cssClass: cssClass[0] ? ' class="' + cssClass.join(" ") + '"' : "",
					};
				}
			});
		},

		firstWeekDay: function(date, leadingRows) {
			if (date.getDay() === 0) {
				leadingRows = leadingRows + 1;
			}
			var first = date.getDate() - date.getDay() + 1 - leadingRows * 7; // First day is the day of the month - the day of the week
			return new Date(date.setDate(first));
		},

		firstVisibleDay: function(leadingRows) {
			var curr = new Date();
			return this.firstWeekDay(curr, leadingRows);
		},

		normalize: function(date) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate());
		},

		setDate: function(date, value) {
			//next date
			date.setTime(date.getTime() + value * MS_PER_DAY);
		},

		toDateString: function(date) {
			return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
		},

		formatTitle: function(date, monthNames, names, pad) {
			return monthNames[date.getMonth()] + ', ' +
				names[date.getDay()] + ' ' +
				pad(date.getDate()) + ', ' +
				date.getFullYear();
		},

		pad: function(n) {
			return (n < 10) ? ("0" + n) : n;
		}
	};

	function view(options) {
		var idx = 0,
			length = options.cells,
			cellsPerRow = options.perRow,
			start = options.start,
			build = options.build,
			content = options.content,
			html = options.html,
			setter = options.setter;

		for (; idx < length; idx++) {
			if (idx > 0 && idx % cellsPerRow === 0) {
				html += '</tr><tr>';
			}
			data = build(start, idx);

			html += content(data);
			setter(start, 1);
		}
		return html + "</tr></tbody></table></div>";
	}


	//Main
	function LightCalendar() {
		var that = this;
		this.initialized = false;

		this.container = $('<div class="l-calendar" style="display: none" ><div>');
		this.regional = []; // Available regional settings, indexed by language code
		this.regional[""] = { // Default regional settings
			monthNames: ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"
			], // Names of months for formatting
			monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // For formatting
			dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], // For formatting
			dayNamesShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // For formatting
			dayNamesMin: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], // Column headings for days starting at Sunday

		};

		this._defaults = { // Global defaults for all the date picker instances
			showOn: "focus", // "focus" for popup on focus,
			showAnim: "fadeIn", // Name of jQuery animation for popup
			duration: "fast", // Duration of display/closure

			inputCss: "",
			labelCss: "",
			label: "",

			weekends: [0],
			holidays: [],
			maxDays: MAX_DAYS,
			leadingRows: 2,
		};

		$.extend(this._defaults, this.regional[""]);

		this._instanceManager = new InstanceManager(this.container, this._defaults);
		this._popupManager = new PopupManager(this.container, this._instanceManager);
		this.calendar = null;
	}

	$.extend(LightCalendar.prototype, {
		markerClassName: "hasCalendar",

		init: function($divs, options) {
			var that = this;
			if($divs.length === 0)
				return;

			var calendarTemplate = template('<label for="<%= inputID%>" class="<%= labelCss%>"><%= label%></label>' +
			'<input id="<%= inputID%>" type="text" class="<%= inputCss%>"></input>');

			$divs.empty().append(calendarTemplate({
				inputID: $divs.attr('id') + "Input",
				label: options.label || that._defaults.label,
				labelCss: options.labelCss || that._defaults.labelCss,
				inputCss: options.inputCss || that._defaults.inputCss,
			}));        

			var $elements = $divs.find('input');
			this._instanceManager.init($elements, options);
			this._popupManager.init($elements);


			if (!this.initialized) {
				$(document).mousedown(function(event) {
					that.checkExternalClick(event);
				});
				this.initialized = true;
			}

			$elements.each(function() {
				that._connectCalendar(this);
			});
			return this;
		},

		checkExternalClick: function(event) {
			var currInst = this._instanceManager.getCurrent();
			if (!currInst) {
				return;
			}

			var $target = $(event.target);
			var inst = this._instanceManager.get($target[0]);

			if (!$target.hasClass(this.markerClassName) &&
				!this._instanceManager.compare(inst) &&
				!this._popupManager.isPopup($target)) {
				this.close();
			}

		},

		_connectCalendar: function(target) {
			var that = this;
			var element = $(target);

			if (element.hasClass(this.markerClassName)) {
				return;
			}

			var openHandler = function(event) {
				that.open($(event.target));
			};

			element.unbind("focus", openHandler);
			element.focus(openHandler);

			element.addClass(this.markerClassName);
		},

		_calendar: function(element) {
			var that = this;
			if (!that.calendar) {
				that.calendar = new Calendar(that.container, that._instanceManager);
				that.calendar.register({
					change: function(date, inst) {

						that.setDate(date, inst);
					}
				});
			}
			that.calendar.update(element);
		},

		setDate: function(date, inst) {
			inst.date = date;
			var dateString = this.calendar.format(date);
			$(inst.input).val(dateString);

			this._popupManager.close();
		},

		setOptions: function() {

		},

		open: function($element) {
			var element = $element[0];
			element = element.target || element;

			this._calendar(element);
			this._popupManager.open(element);
			this.calendar.scrollToSelectedDate(element);
		},

		close: function() {
			this._popupManager.close();
		}
	});

	//lite weight template engine
	var template = (function(str, data) {
		// Simple JavaScript Templating
		// John Resig - http://ejohn.org/ - MIT Licensed
		var cache = {};

		return function tmpl(str, data) {
			// Figure out if we're getting a template, or if we need to
			// load the template - and be sure to cache the result.
			var fn = !/\W/.test(str) ?
				cache[str] = cache[str] ||
				tmpl(document.getElementById(str).innerHTML) :

				// Generate a reusable function that will serve as a template
				// generator (and which will be cached).
				new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +

					// Introduce the data as local variables using with(){}
					"with(obj){p.push('" +

					// Convert the template into pure JavaScript
					str
					.replace(/[\r\t\n]/g, " ")
					.split("<%").join("\t")
					.replace(/((^|%>)[^\t]*)'/g, "$1\r")
					.replace(/\t=(.*?)%>/g, "',$1,'")
					.split("\t").join("');")
					.split("%>").join("p.push('")
					.split("\r").join("\\'") + "');}return p.join('');");

			// Provide some basic currying to the user
			return data ? fn(data) : fn;
		};

	}());

	/* Invoke the calendar functionality.*/
	$.fn.lightcalendar = function(options) {
		return $.lightcalendar.init(this, options);
	};

	$.lightcalendar = new LightCalendar(); // singleton instance
	$.lightcalendar.uuid = new Date().getTime();
}));