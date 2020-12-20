
console.log(ags);
console.log(lands);
console.log(mietwert);

var town;
document.addEventListener("DOMContentLoaded", function() {

    // autocompletion
    document.getElementById("townSelect").addEventListener("keyup", function (event) {
        var input = event.target.value;
        if (input.length >= 2 ) {
            var townlist = document.getElementById("townlist");
            townlist.innerHTML = "";
            var have = 0;
            for (const town of ags) {
                if(! town.Gemeinde.includes(input)) continue;
                var option = document.createElement("option");
                option.value = town.Gemeinde;
                townlist.appendChild(option);
                have += 1;
                if(have==20) break;
            }
        }
    });

    // choose town button
    document.getElementById("doWork").addEventListener("click", function(){
        var chosenTown = document.getElementById("townSelect").value;
        var select = document.getElementById("ags");
        select.innerHTML = "";
        town = undefined;
        var i;
        for(i=0; i<ags.length; i++) {
            if(chosenTown!=ags[i].Gemeinde) continue;
            if(!town) town = ags[i];
            var option = document.createElement("option");
            option.value = i;
            option.innerHTML = ags[i].AGS;
            select.appendChild(option);
        }
        document.getElementById("report").style.display = "none";
        document.getElementById("eingaben").style.display = "none";
        if(!town) return;
        document.getElementById("eingaben").style.display = "block";
        document.getElementById("hebesatz").value = 100*town.Hebesatz;
    });

    // change ags
    document.getElementById("ags").addEventListener("change", function(e){
        town = ags[e.target.selectedOptions[0].value];
        document.getElementById("hebesatz").value = 100*town.Hebesatz;
        document.getElementById("report").style.display = "none";
    });

    document.getElementById("update").addEventListener("click",createReport);
});



function createReport(){
    var report = document.getElementById("report");
    report.style.display = "none";
    if(!town) return;
    var land = lands[parseInt(town.AGS.substring(0, town.AGS.length == 7 ? 1 : 2)) -1]; // first two digits of AGS
    if(!land) return;

    var flats = Number(document.getElementById("wohnungen").value); // F
    var baujahr = Number(document.getElementById("baujahr").value); // G
    var area_indoor = Number(document.getElementById("area_indoor").value); // L
    var area_total = Number(document.getElementById("area_total").value); // V
    var type_select = document.getElementById("house_type");
    var house_type = type_select.options[type_select.selectedIndex].text; // W
    var ground = Number(document.getElementById("ground").value); // AA
    var increase = Number(document.getElementById("hebesatz").value)/100; // AQ
    var social = document.getElementById("social").checked; // AR

    var kennwert_land = parseInt(land.Kennwert); // E
    var kennwert_year = kennwertBaujahr(baujahr); // H
    var kennwert_house_rent = kennwertHouse(house_type)[0]; // X
    var kennwert_house_raw = kennwertHouse(house_type)[1]; // Y
    var kennwert_area = kennwertArea(area_indoor); // N

    var mietstufe = parseInt(town.Mietenstufe); // I
    var area_per_flat = area_indoor/flats; // M

    var value_avg_rent1 = mietwert[kennwert_land+kennwert_house_rent+kennwert_area][kennwert_year-2]; // J
    var mietstufen_factor = [0.775, 0.9, 1.0, 1.1, 1.2, 1.325]; // Miete + Zu-/Abschlag Mietstufe Anlage 13 Anlage 39 (zu § 254 Absatz 2) II.
    var value_avg_rent2 = round2(mietstufen_factor[mietstufe-1] * value_avg_rent1); // K

    var interest = kapitalisierung(house_type == "MFH" ? flats : ground, house_type); // O
    // Anlage 12 Anlage 38 (zu § 253 Absatz 2 und 259 Absatz 4)
    var remaining_usage = Math.max(0, 80-(new Date().getFullYear()-baujahr)); // P
    // §258 (2)
    var remaining_usage_capped = Math.max(24, remaining_usage); // Q
    var kennwert_usage = remaining_usage_capped - 22; // R
    // Anlage 14 Anlage 40 (zu § 255 Absatz 2)
    var tax_non_relocatable = bewirtschaftungskosten(remaining_usage, house_type); // T
    var annual_raw = round2(12 * area_indoor * value_avg_rent2); // AH
    var non_relocatable_cost = round2(annual_raw * (tax_non_relocatable / 100)); // U
    // Anlage 10 Anlage 36 (zu § 251 und § 257 Absatz 1)
    var coefficient = umrechnungskoeffizient(area_total, house_type); // AF
    var ground_value = round2(area_total * ground * coefficient); // AG

    var annual_clean = round2(annual_raw - non_relocatable_cost); // AI
    var tax_factor = round3(1 + interest/100); // AJ
    // Anlage 11 Anlage 37 (zu § 253 Absatz 2)
    // (1/(AJ18^Q18))*(((AJ18^Q18)-1)/(AJ18-1))
    var aj_q = Math.pow(tax_factor,remaining_usage_capped);
    var multiplier = round2((1/aj_q)*((aj_q-1)/(tax_factor-1))); // AK
    // Anlage 15 Anlage 41 (zu § 257 Absatz 2)
    var detaxinator = round4(1/aj_q); // AL
    var interesting_ground = round2(ground_value * detaxinator); // AM
    var cash_clean = round2(annual_clean*multiplier); // AN
    var min_value = round_2(ground * area_total)*0.75; // AO
    var object_worth = Math.max(min_value, round_2(interesting_ground+cash_clean)); // AP

    // Steuermesszahl: 0,34 §15 (1) 2. a)/b)
    var some_factor = (house_type == "MFH" && social) ? 0.000255 : 0.00034;
    var annual_tax = round2(object_worth * increase * some_factor);

    document.getElementById("gemeinde").innerHTML = town.Gemeinde;
    document.getElementById("land").innerHTML = land.Land;
    document.getElementById("tax").innerHTML = annual_tax;
    report.style.display = "block";
}

function round_2(x) { return Math.round(x/100)*100; }
function round2(x) { return Math.round(x*100)/100; }
function round3(x) { return Math.round(x*1000)/1000; }
function round4(x) { return Math.round(x*10000)/10000; }

function kennwertBaujahr(x) {
    if(x<=1948) return 2;
    if(x<=1978) return 3;
    if(x<=1990) return 4;
    if(x<=2000) return 5;
    return 6;
}

function kennwertHouse(x) {
    if(x=="MFH") return [30,4];
    if(x=="WEG") return [30,3];
    if(x=="EFH") return [10,2];
    return [20,1]; // ZFH
}

function kennwertArea(x) {
    if(x>100) return 3; // was inconsistent in Datenausgabe and Mietwertabelle
    if(x>=60) return 2;
    return 1;
}

function kapitalisierung(x, type) {
    if(type=="EFH" || type =="ZFH") {
        if(x<600) return 2.5;
        if(x>=1500) return 1.5;
        return 3.0 - 0.1 * Math.floor(x/100);
    }
    if(type=="WEG") {
        if(x<2100) return 3.0;
        if(x>=3000) return 2.0;
        return 5.0 - 0.1 * Math.floor(x/100);
    }
    // MFH
    return x > 6 ? 4.5 : 4.0;
}

function bewirtschaftungskosten(remaining_usage, type) {
    var index = Math.min(3,Math.floor(remaining_usage/20));
    if(type=="EFH" || type =="ZFH")
        return [27, 25, 21, 18][index];
    if(type=="WEG")
        return [31, 29, 25, 23][index];
    return [29, 27, 23, 21][index]; // MFH
}

function umrechnungskoeffizient(area, type) {
    if(type == "WEG" || type== "MFH") return 1.0;
    // EFH or ZFH ...
    var values = [
        1.24, 1.19, 1.14, 1.10, 1.06, 1.03, 1.00, 0.98, 0.95, 0.94,
        0.92, 0.90, 0.89, 0.87, 0.86, 0.85, 0.84, 0.83, 0.82, 0.81,
        0.80, 0.79, 0.78, 0.77, 0.76, 0.75, 0.74, 0.73, 0.72, 0.71,
        0.70, 0.69, 0.68, 0.67, 0.66, 0.65, 0.64
    ];
    index = Math.min(36, Math.max(0, Math.floor(area/50) - 4));
    return values[index];
}
