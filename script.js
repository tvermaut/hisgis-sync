function sync(){
    let osmid = $("#osmid").val();
    fetch('https://osm.hisgis.nl/api/0.6/way/' + osmid + '/')
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => verwerkPerceel(data.getElementById(osmid).getElementsByTagName("tag")));
}

function verwerkPerceel(tags){
    let p = new Perceel();
    p.laadOSM(tags);
    $("#uitvoer").append('<a href="' + p.OATURI() + '" target="_blank">Ga naar OAT-def</a>');
}

class Perceel {
    constructor() {
        this.gemeente = null;
        this.sectie = null;
        this.perceelnr = null;
        this.perceelnrtvg = null;
    }

    laadOSM(tags){
        for(let t of tags){
            let k = t.getAttribute("k");
            let v = t.getAttribute("v");
            switch(k){
                case 'kad:gemeente': this.gemeente = v; break;
                case 'kad:sectie': this.sectie = v; break;
                case 'kad:perceelnr': this.perceelnr = v; break;
                case 'kad:perceelnrtvg': this.perceelnrtvg = v; break;
            }
        }
    }

    get OATURI(){
        return 'https://oat.hisgis.nl/oat-ws/rest/percelen/' + this.gemeente + '/' + this.sectie + '/' + this.perceelnr + (this.perceelnrtvg ? '/' + this.perceelnrtvg : '');
    }
}