LightCalendar
===============
Light weight calendar.

## [Demo](http://northerneyes.github.io/LightCalendar)
A demo is available on the Github Pages [here](http://northerneyes.github.io/LightCalendar)

##Basic Usage
### Default usage with a label and some input css style.
```javascript
    var defaultCalendar = $('#defaultCalendar').lightcalendar({
        label: 'Default calendar',
        inputCss: 'form-control'
    });
```
### Calendar with custom weekends.
```javascript
    var weekendsCalendar = $('#weekendsCalendar').lightcalendar({
        label: 'Weekends calendar',
        inputCss: 'form-control',
        weekends: [0, 6]
    });
```
### Calendar with holidays
```javascript
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
```
### Calendar with custom leading rows before the current day
```javascript
    var leadingRowsCalendar = $('#leadingRowsCalendar').lightcalendar({
        label: 'Four leading rows before the current day',
        inputCss: 'form-control',
        leadingRows: 4
    });
```
### Calendar with a preset date
```javascript
    var presetDateCalendar = $('#presetDateCalendar').lightcalendar({
        label: 'Calendar with a preset date',
        inputCss: 'form-control',
        date: new Date()
    });
```
### Set the date after widget initialization
```javascript
    var setDateAfterInitCalendar = $('#setDateAfterInitCalendar').lightcalendar({
        label: 'Set date after init calendar',
        inputCss: 'form-control'
    });
    setDateAfterInitCalendar.lightcalendar("date", new Date());
```
### Set options after widget initialization
```javascript
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
```
