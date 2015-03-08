$(document).ready(function() {

	var defaultCalendar = $('#defaultCalendar').lightcalendar({
		label: 'Default calendar',
		inputCss: 'form-control'
	});

	var weekendsCalendar = $('#weekendsCalendar').lightcalendar({
		label: 'Weekends calendar',
		inputCss: 'form-control',
		weekends: [0, 6]
	});

	var holidaysCalendar = $('#holidaysCalendar').lightcalendar({
		label: 'Holidays calendar',
		inputCss: 'form-control',
		holidays: [
			new Date(2015, 2, 16),
			new Date(2015, 2, 19),
			new Date(2015, 2, 24),
			new Date(2015, 2, 27),
			new Date(2015, 3, 2)
		]
	});

	var leadingRowsCalendar = $('#leadingRowsCalendar').lightcalendar({
		label: 'Four leading rows before the current day',
		inputCss: 'form-control',
		leadingRows: 4
	});

	var presetDateCalendar = $('#presetDateCalendar').lightcalendar({
		label: 'Calendar with a preset date',
		inputCss: 'form-control',
		date: new Date()
	});

	var setDateAfterInitCalendar = $('#setDateAfterInitCalendar').lightcalendar({
		label: 'Set date after init calendar',
		inputCss: 'form-control'
	});
	setDateAfterInitCalendar.lightcalendar("date", new Date());

	var setOptionsAfterInitCalendar = $('#setOptionsAfterInitCalendar').lightcalendar({
		label: 'Set some options after init calendar',
		inputCss: 'form-control'
	});

	setOptionsAfterInitCalendar.lightcalendar("options", {
		leadingRows: 4,
		holidays: [
			new Date(2015, 2, 16),
			new Date(2015, 2, 19),
			new Date(2015, 2, 24),
			new Date(2015, 2, 27),
			new Date(2015, 3, 2)
		],
		date: new Date(2015, 2, 26),
		weekends: [0, 6]
	});

});