import { templates, select, classNames } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;
    console.log(thisHome);
    thisHome.render(element);
    thisHome.initLinks();
  }

  render(element) {
    const thisHome = this;
    const generateHTML = templates.home();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generateHTML;
  }

  transitionPage(pageId) {
    const thisHome = this;
    console.log(pageId);
    thisHome.pages = document.querySelector(select.containerOf.pages).children;
    console.log(thisHome.pages);
    thisHome.navLinks = document.querySelectorAll(select.nav.links);
    console.log(thisHome.navLinks);

    for (let page of thisHome.pages) {
      page.classList.toggle(classNames.pages.active, page.id === pageId);
    }
    for (let link of thisHome.navLinks) {
      link.classList.toggle(classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  }
  initLinks() {
    const thisHome = this;

    thisHome.links = document.querySelectorAll('.link');

    for (let link of thisHome.links) {
      link.addEventListener('click', function (event) {
        event.preventDefault;
        const clickedLink = this;
        const id = clickedLink.getAttribute('href').replace('#', '');

        thisHome.transitionPage(id);
      });
    }
  }
  


}
export default Home;


