function sync(){
    let osmid = $("#osmid").val();
    let geotype = $("#geotype").val();
    fetch('https://osm.hisgis.nl/api/0.6/' + geotype + '/' + osmid + '/')
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => verwerkPerceel(data.getElementById(osmid).getElementsByTagName("tag")));
}

function verwerkPerceel(tags){
    var p = new Perceel();
    p.laadOSM(tags);
    fetch(p.OATURI())
        .then((response) => response.json())
        .then((data) => p.laadOAT(data)).then(function(){
            let c = document.createElement("div");
            c.setAttribute("class", "card");
            c.setAttribute("style", "width: 18rem;");
            let cb = document.createElement("div");
            cb.setAttribute("class", "card-body");
            let ch = document.createElement("h5");
            ch.setAttribute("class", "card-title");
            ch.innerText = p.adres();
            cb.appendChild(ch);
            let cl = document.createElement("ul");
            cl.setAttribute("class", "list-group list-group-flush");
            for(let t of p.tags){cl.appendChild(t.card());}
            cb.appendChild(cl);
            c.appendChild(cb);
            $("#uitvoer").append(c);
            });
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
        console.log(j);
        this.gg = j.results[0].grondGebruik;
        if(!this.tags.includes("oat:soort")){
            let t = new Tag("oat:soort",this.gg);
            t.nieuw = true;
            this.tags[t.k] = t;
        } else if(this.tags.includes("oat:soort") && this.tags["oat:soort"] != this.gg){
            t.fout = true;
            t.v = "[" + t.v + " ≠ " + this.gg + "]";
        }
        console.log(this);
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