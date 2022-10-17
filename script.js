async function sync(){
    let osmid = $("#osmid").val();
    let geotype = $("#geotype").val();
    fetch('https://data.hisgis.nl/w/api.php?action=wbgetentities&ids=Q101&format=json')
        .then(response => response.json())
        .then(data => verwerkWB(data.entities.Q101))
        .then((data) => {
    fetch('https://osm.hisgis.nl/api/0.6/' + geotype + '/' + osmid + '/')
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => verwerkPerceel(data.getElementById(osmid).getElementsByTagName("tag")));
    });
}

var tagalias = [];

function verwerkPerceel(tags){
    var p = new Perceel();
    p.laadOSM(tags);
    fetch(p.OATURI())
        .then((response) => response.json())
        .then((data) => p.laadOAT(data)).then(function(){
            let c = document.createElement("div");
            c.setAttribute("class", "card mt-2");
            c.setAttribute("style", "width: 25rem;");
            let cb = document.createElement("div");
            cb.setAttribute("class", "card-body");
            let ch = document.createElement("h5");
            ch.setAttribute("class", "card-title");
            ch.innerText = p.adres();
            cb.appendChild(ch);
            let cl = document.createElement("ul");
            cl.setAttribute("class", "list-group list-group-flush");
            for(let t in p.tags){cl.appendChild((p.tags[t]).card());}
            cb.appendChild(cl);
            c.appendChild(cb);
            $("#uitvoer").append(c);
            });
    console.log(getTags(p.gg));
    //return p
}

async function verwerkWB(j){
    // P33 = ongebouwd
    for(let i of j.claims.P33){
        await checkWBi(i.mainsnak.datavalue.value.id);
        if(i.hasOwnProperty("qualifiers") && i.qualifiers.hasOwnProperty("P36")){
            for(let q of i.qualifiers.P36){ // P36 = tariefsoort
                await checkWBi(q.datavalue.value.id);
                }
            }
        }
    // P33
}

async function checkWBi(wbid){
    await fetch('https://data.hisgis.nl/w/api.php?action=wbgetentities&ids=' + wbid + '&format=json')
        .then((response) => response.json())
        .then((data) => verwerkUnit(data.entities));
}

function getNL(item){
    return item.value;
}

function getTags(gg){
    tags = [];
    for(let t in tagalias){
        if (gg && gg in tagalias[t]){tags += t;}
    }
    return tags;
}

async function verwerkUnit(data){
    let q = await data[Object.getOwnPropertyNames(data)[0]];
    if(q.claims.hasOwnProperty("P29")){
        for (let t of q.claims.P29){
            let tag = t.mainsnak.datavalue.value;
            if(!(tag in tagalias)){tagalias[tag] = [];}
            (tagalias[tag]).concat(q.aliases.nl.map(getNL));
            }
    }
    
    // P29 = OSM-tag
    // P30 = tariefsoortnaam
    // P36 = tariefsoort
    // P43 = kleur
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
                    this.tags[k] = ti;
            }
        }
    }

    laadOAT(j){
        //console.log(j);
        this.gg = j.results[0].grondGebruik;
        if(!("oat:soort" in this.tags)){
            let t = new Tag("oat:soort",this.gg);
            t.nieuw = true;
            this.tags[t.k] = t;
        } else if("oat:soort" in this.tags && this.tags["oat:soort"].v != this.gg){
            console.log("mismatch tussen |" + this.tags["oat:soort"].v + "| (osm)    en |" + this.gg + "| (oat)")
            this.tags["oat:soort"].fout = true;
            this.tags["oat:soort"].v = "[" + this.tags["oat:soort"].v + " ≠ " + this.gg + "]";
        }
        //console.log(this);
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
    nieuw;
    fout;

    constructor(k, v){
        this.k = k;
        this.v = v;
    }

    lbl() {
        return this.k + '=' + this.v 
    }

    card() {
        let l = document.createElement("li");
        l.setAttribute("class", "list-group-item" + (this.nieuw ? " bg-success bg-opacity-25" : "") + (this.fout ? " text-danger" : ""));
        let k = document.createElement("span");
        k.setAttribute("class", "text-end");
        k.innerText = this.k;
        l.appendChild(k);
        let e = document.createElement("span");
        e.setAttribute("class", "text-center mx-2");
        e.innerText = '=';
        l.appendChild(e);
        let v = document.createElement("span");
        v.setAttribute("class", "text-start");
        v.innerText = this.v;
        l.appendChild(v);
        return l
    }
}