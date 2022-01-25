import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import HourPicker from './HourPicker.js';
import DatePicker from './DatePicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectedTable = [];
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    console.log('getData params', params);

    const urls = {
      bookings:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.bookings.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    // console.log('getData urls', urls)
    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table, 
            this.updateDOM()
          );
        }
      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] === 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      // console.log('loop', hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] === 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] === 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ===
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.bookings.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables(event) {
    const thisBooking = this;
    const clickedElementIsTable = event.target.classList.contains('table');
    const bookedTable = event.target.classList.contains(
      classNames.booking.tableBooked
    );
    const alreadySelected = event.target.classList.contains('selected');
    if (clickedElementIsTable) {
      if (!bookedTable) {
        const tableId = event.target.getAttribute('data-table');
        thisBooking.selectedTable.push(tableId);
        // if (activeTable !== null && activeTable !== event.target) {
        thisBooking.removeTableSelection();
        // }
        event.target.classList.add('selected');
      }
      if (bookedTable) {
        window.alert('Ten stolik jest już zajęty');
      }
      if(alreadySelected){
        thisBooking.selectedTable= [];
        event.target.classList.remove('selected');
      }
    }
  }

  removeTableSelection() {
    const thisBooking = this;
    for (let table of thisBooking.dom.tables) {
      if (table.classList.contains('selected')) {
        table.classList.remove('selected');
      }
    }
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const formData = utils.serializeFormToObject(thisBooking.dom.form);
    console.log(formData);

    const payload = {
      date: formData.date[0],
      table: thisBooking.selectedTable[0],
      // hour: formData.hour[0],
      hour: utils.numberToHour(formData.hour[0]),
      // duration: formData.hours[0],
      duration: Number(formData.hours[0]),
      // ppl: formData.people[0],
      ppl: Number(formData.people[0]),
      phone: formData.phone[0],
      address: formData.address[0],
      starters: [],
    };

    for (let starter in thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    console.log(payload.starters);
    console.log(payload);

    thisBooking.send(url, payload);
    // thisBooking.makeBooked(
    //   payload.date,
    //   payload.hour,
    //   payload.duration,
    //   payload.table
    // );
  }

  send(url, payload) {
    const thisBooking = this;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then(thisBooking.makeBooked(
        payload.date,
        payload.hour,
        payload.duration,
        payload.table
      ))
      .then(this.removeTableSelection());
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    (thisBooking.dom = {}), (thisBooking.dom.wrapper = element);
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = element.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = element.querySelector(
      select.booking.hoursAmount
    );

    thisBooking.dom.datePicker = element.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = element.querySelector(
      select.widgets.hourPicker.wrapper
    );

    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = element.querySelector(select.booking.floorPlan);
    thisBooking.dom.form = element.querySelector(select.booking.form);

    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.startes = element.querySelector(select.booking.starters);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);

    thisBooking.dom.hoursAmount.addEventListener('updated', function () {});

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.dom.hoursAmount.addEventListener('updated', function () {});

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.hourPicker.addEventListener('updated', function () {});

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);

    thisBooking.dom.datePicker.addEventListener('updated', function () {});

    // thisBooking.dom.datePicker.addEventListener('updated', function (event) {
    //   thisBooking.initTables(event);
    // });

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      thisBooking.removeTableSelection();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.initTables(event);
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      // console.log('it works');
      thisBooking.sendBooking();
      console.log('it works');
    });
  }
}

export default Booking;
