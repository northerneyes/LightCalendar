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
		this.initialized = false;
		this.instanceManager = instanceManager;
		this.container = container;
		this.popupID = "light-popup-container";
		this.popupShowing = false;
		this.lastElement = null;

		this.container.attr('id', this.popupID);

	}

	$.extend(PopupManager.prototype, {
		markerClassName: "hasPopup",
		init: function(elements) {
			var that = this;

			if (!this.initialized) {
				$(document).mousedown(function(event) {
					that.checkExternalClick(event);
				});
				this.initialized = true;
			}

			if ($("#" + this.popupID).length === 0) {
				$("body").append(this.container);
			}

			elements.each(function() {
				that.connectPopup(this);
			});
		},

		checkExternalClick: function(event) {
			var currInst = this.instanceManager.getCurrent();
			if (!currInst) {
				return;
			}

			var $target = $(event.target);
			var inst = this.instanceManager.get($target[0]);

			if (!$target.hasClass(this.markerClassName) && !this.instanceManager.compare(inst)) {
				this.close();
			}

		},

		connectPopup: function(target) {
			var that = this;
			var element = $(target);

			if (element.hasClass(this.markerClassName)) {
				return;
			}

			var openPopupHandler = function(event) {
				that.open(event);
			};

			element.unbind("focus", openPopupHandler);
			element.focus(openPopupHandler);
			element.addClass(this.markerClassName);
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
			element = element.target || element;

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

			// if (inst.input.is(":visible") && !inst.input.is(":disabled")) {
			// 	inst.input.focus();
			// }

			this.popupShowing = true;
			this.instanceManager.setCurrent(inst);

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

	//Main
	function LightCalendar() {
		this.container = $('<div class="l-calendar" style="display: none" >123<div>');
		this.regional = []; // Available regional settings, indexed by language code
		this.regional[""] = { // Default regional settings
			monthNames: ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"
			], // Names of months for formatting
			monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // For formatting
			dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], // For formatting
			dayNamesShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // For formatting
			dayNamesMin: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], // Column headings for days starting at Sunday
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

		this._instanceManager = new InstanceManager(this.container, this._defaults);
		this._popupManager = new PopupManager(this.container, this._instanceManager);

	}

	$.extend(LightCalendar.prototype, {
		init: function(elements, options) {
			var that = this;
			this._instanceManager.init(elements, options);
			this._popupManager.init(elements);
			// this.calendar = new Calendar(instanceManager);
			return this;
		},

		setOptions: function() {

		},

		open: function($element) {
			// this.calendar()
			this._popupManager.open($element[0]);
		},

		close: function() {
			this._popupManager.close();
		}
	});

	/* Invoke the calendar functionality.*/
	$.fn.lightcalendar = function(options) {
		return $.lightcalendar.init(this, options);
	};

	$.lightcalendar = new LightCalendar(); // singleton instance
	// $.lightcalendar.initialized = false;
	$.lightcalendar.uuid = new Date().getTime();
}));