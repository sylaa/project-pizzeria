import { render } from 'node-sass';

class Booking {
  constructor(element) {
    const thisBooking = this;
    
    render(element);
    initWidgets();
  }

  render(element){
      const thisBooking = this;

      const generatedHTML = templates.bookingWidget,

      thisBooking.dom = {};

      thisBooking.dom.wrapper = element;
    
      thisBooking.dom.wrapper.innerHTML(generatedHTML);


  }
}
