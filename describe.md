Hello Tatjana,

I've created gh-pages for this task

http://northerneyes.github.io/LightCalendar

and github project
https://github.com/northerneyes/LightCalendar

The page has several examples of using a calendar: 
- default representation
- with preset weekends
- with preset holydays,
- with leading rows before the current day
- with preset date,
- And examples with manipulating options after creating the widget

About realization. The calendar is a jquery plugin. It support AMD or can be added as browser globals. The calendar has several modules inside it:
- The First module is a InstanceManager. The InstanceManager manipulates instances of our widget. It creates new, set or get current visible widget, compare instances to the current, get the instances from DOM elements and retrive the options for instances fro DOM elements.
- The Second module is PopupManager. The PopupManager controls of show/hide logic for our calendar, and that's all.
- The Main module is Calendar. The module updates our widget, send some events and format the date. The module use a common caledar object, this is a builder for our widget. It provides title, content and several utils methods (firstWeekDay, firstVisibleDay etc).  All options of represantation of our widget (weekeds, holydays, leading rows) implements here, in one place. The caledar use "view" function. The view is template function, it use build function, how to build all calendar content and cell template function, how to build a cell. 
- And the LightCalendar is our widget itself. In fact it is a facade for all modules above.

As you can see the widget has well structure architecture, all modules have one resonsibility, easy to understand and easy to implements new features in future. For example it is no problem to create year or decade views for our widget. All what we need is to create a new view in our calendar common object, that has own title, content and utils function for representation of view. And that's all, it will use the view template function and will not require something else.

About performance. The widget uses one container for all instances and one singlenton instance of widget itself. We are managing all the other instances by an InstanceManager. Because of that we can initialize a lot of widgets on the page with no problems. The siglenton widget init only once and after that we rerender calendar for the current instance only if it was invoked. 

Also I've used a tiny template engine for this task, for render cells for the calendar. It created by John Resig, and contain only 40 lines of code. In real live applications I very often use a template engines (i.e. handlebars), because it very useful, it does your code more readable, more understandable, more clean and allows to you very ease to extend functionality or to change the template based on data. In such task it was very helpful.

Best regards,
George Bukhanov