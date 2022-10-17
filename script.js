async function sync(){
    let osmid = $("#osmid").val();
    let geotype = $("#geotype").val();
    fetch('https://osm.hisgis.nl/api/0.6/' + geotype + '/' + osmid + '/')
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => verwerkPerceel(data.getElementById(osmid).getElementsByTagName("tag")));
}

var tagalias = [];
var aantalGG = 0;
$(function() {
    fetch('https://data.hisgis.nl/w/api.php?action=wbgetentities&ids=Q101&format=json')
        .then(response => response.json())
        .then(data => verwerkWB(data.entities.Q101))
        .then(data => {
            $('#syncknop').html("sync");
            $('#syncknop').prop("disabled", false);
            $('#syncknop').prop("enabled", true);
            });
  });

function verwerkPerceel(tags){
    var p = new Perceel();
    p.laadOSM(tags);
    fetch(p.OATURI())
        .then((response) => response.json())
        .then((data) => p.laadOAT(data))
        .then(function(){
            let c = document.createElement("div");
            c.setAttribute("class", "card mt-2 position-relative mx-auto");
            c.setAttribute("style", "width: 25rem;");
            let x = document.createElement("button");
            x.setAttribute("class", "btn-close position-absolute top-0 end-0");
            x.setAttribute("type", "button");
            c.appendChild(x);
            let cbadge = document.createElement("div");
            cbadge.setAttribute("class", "position-absolute fs-6 font-monospace rounded p-1 top-0 end-0 me-5 mt-1 bg-secondary text-white");
            cbadge.innerHTML = $("#osmid").val();
            c.appendChild(cbadge);
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
    //console.log(getTags(p.gg));
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
    var tagsi = [];
    //console.log("zoeken naar: " + gg);
    for(let t in tagalias){
        if (gg && tagalias[t].includes(gg)){
            tagsi.push(t);}
    }
    return tagsi;
}

async function verwerkUnit(data){
    let q = await data[Object.getOwnPropertyNames(data)[0]];
    if(q.claims.hasOwnProperty("P29")){
        for (let t of q.claims.P29){
            let tag = t.mainsnak.datavalue.value;
            if(!(tag in tagalias)){tagalias[tag] = [];}
            tagalias[tag] = (tagalias[tag]).concat(q.aliases.nl.map(getNL));
            aantalGG += q.aliases.nl.length;
            $('#aantalgggeladen').html(aantalGG.toLocaleString("nl-NL"));
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
        if(!(this.gemeente && this.sectie && this.perceelnr)){
            $('#waarschuwing').html('het opgegeven id is GEEN perceel');
        } else {$('#waarschuwing').html('');}
    }

    async laadOAT(j){
        //console.log(j);
        this.gg = await j.results[0].grondGebruik;
        let ts = getTags(await this.gg);
        for (let tsi of ts){
            console.log(tsi);
            if(tsi.includes("=")){
                let tsis = tsi.split("=");
                let tx = new Tag(tsis[0], tsis[1]);
                if(tx.k in this.tags){
                    // als ook value gelijk: doe niets
                    // anders: update
                    this.tags[tx.k] = tx;
                    this.tags[tx.k].update = true
                } else {
                    // nieuw aanmaken
                    tx.nieuw = true;
                    this.tags[tx.k] = tx;
                    }
                }
            }
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
    update;

    constructor(k, v){
        this.k = k;
        this.v = v;
    }

    lbl() {
        return this.k + '=' + this.v 
    }

    card() {
        let l = document.createElement("li");
        l.setAttribute("class", "list-group-item" + (this.nieuw ? " bg-success bg-opacity-25" : "") + (this.update ? " bg-warning bg-opacity-25" : "") + (this.fout ? " text-danger" : ""));
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