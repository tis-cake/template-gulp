ymaps.ready(init);

function init() {

  if (document.querySelector('#map') === null) {
    return false;
  }

  var map = new ymaps.Map('map', {
    center: [55.719270, 37.625007],
    zoom: 11,
    controls: [],
    behaviors: ['drag', 'dblClickZoom']
  });

  var iconParam = {
    iconLayout: 'default#image',
    iconImageHref: 'img/marker-maps.png',
    iconImageSize: [40, 45]
  }

  myPlacemark = new ymaps.Placemark([55.719270, 37.625007], {
      balloonContent: 'Контент'
  }, iconParam );

  map.geoObjects.add(myPlacemark);
}
