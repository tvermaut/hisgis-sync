function sync(){
    let osmid = $("#osmid").val();
    fetch('https://osm.hisgis.nl/api/0.6/way/' + osmid + '/')
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => verwerkPerceel(data.getElementById(osmid).getElementsByName("tag")));
}

function verwerkPerceel(tags){
    for(let t of tags){
        $("#uitvoer").append('<p>' + t.getAttribute("k") + '=' + t.getAttribute("v") + '</p>');
    }
}