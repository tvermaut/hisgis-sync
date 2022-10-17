function sync(){
    let osmid = $("#osmid").val();
    fetch('https://osm.hisgis.nl/api/0.6/way/' + osmid + '/')
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => verwerkPerceel(data.getElementById(osmid).getElementsByTagName("tag")));
}

function verwerkPerceel(tags){
    var p = new Perceel();
    p.laadOSM(tags);
    fetch(p.OATURI())
        .then((response) => response.json())
        .then((data) => p.laadOAT(data));
    $("#uitvoer").append('<table><tr><th colspan="2">' + p.adres() + '</th></tr><tr><th>k</th><th>v</th></tr>');
    for(let t of p.tags){
        $("#uitvoer").append('<tr><td style="text-align:right;">' + t.k + '</td><td>=</td><td>' + t.v + '</td></tr>');
    }
    $("$uitvoer").append('</table>')
}

class Perceel {
    constructor() {
        this.gemeente = null;
        this.sectie = null;
        this.perceelnr = null;
        this.perceelnrtvg = null;
        this.gg = null;
        this.tags = [];
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
                default:
                    let ti = new Tag(k, v);
                    this.tags.push(ti);
            }
        }
    }

    laadOAT(j){
        this.gg = j.results[0].grondGebruik;
    }

    OATURI(){
        return 'https://oat.hisgis.nl/oat-ws/rest/percelen/' + this.gemeente + '/' + this.sectie + '/' + this.perceelnr + (this.perceelnrtvg ? '/' + this.perceelnrtvg : '');
    }

    adres(){
        return this.gemeente + ' ' + this.sectie + this.perceelnr + (this.perceelnrtvg ? '/' + this.perceelnrtvg : '');
    }
}

class Tag{
    k;
    v;

    constructor(k, v){
        this.k = k;
        this.v = v;
    }

    lbl() {
        return this.k + '=' + this.v 
    }
}