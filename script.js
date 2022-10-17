function sync(){
    let osmid = $("#osmid").val();
    fetch('https://osm.hisgis.nl/api/0.6/way/' + osmid + '/')
  .then((response) => response.xml())
  .then((data) => console.log(data));
}