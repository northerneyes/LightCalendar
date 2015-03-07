$(document).ready(function() {

	var lightCalendar = $('#calendar').lightcalendar({days: [1, 2, 3]});
	lightCalendar.open( $('#calendar'));

	var lightcalendar2 = $('#calendar2').lightcalendar({label: "Hello"});
});