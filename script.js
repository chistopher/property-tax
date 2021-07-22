
console.log(ags);
console.log(lands);
console.log(mietwert);

function getLand(ags) {
    return lands[parseInt(ags.slice(0,-6))-1];
}

function hide(hideAGS = true) {
    document.getElementById("report").style.display = "none";
    document.getElementById("eingaben").style.display = "none";
    document.getElementById("ham_eingaben").style.display = "none";
    document.getElementById("bw_eingaben").style.display = "none";
    document.getElementById("bayern_eingaben").style.display = "none";
    document.getElementById("hes_eingaben").style.display = "none";
    if(hideAGS) document.getElementById("agsDiv").style.display = "none";
}

function pickLand() {
    hide();
    let landSelect = document.getElementById("landSelect");
    let townSelect = document.getElementById("townSelect");
    let agsSelect = document.getElementById("agsSelect");
    townSelect.innerHTML = "<option>---</option>";
    agsSelect.innerHTML = "<option>---</option>";
    if(landSelect.value=="---") return;

    // fill towns
    for (const town of ags) {
        if(getLand(town.AGS).Land != landSelect.value) continue;
        let option = document.createElement("option");
        option.innerHTML = town.Gemeinde;
        townSelect.appendChild(option);
    }
}

function pickTown() {
    hide();
    let landSelect = document.getElementById("landSelect");
    let townSelect = document.getElementById("townSelect");
    let agsSelect = document.getElementById("agsSelect");
    document.getElementById("agsDiv").style.display = "none";
    agsSelect.innerHTML = "<option>---</option>";
    if(landSelect.value=="---") return;
    if(townSelect.value=="---") return;

    // fill AGS
    agsSelect.innerHTML = "";
    for (const town of ags) {
        if(getLand(town.AGS).Land != landSelect.value) continue;
        if(town.Gemeinde.trim() != townSelect.value) continue;
        let option = document.createElement("option");
        option.innerHTML = town.AGS
        agsSelect.appendChild(option);
    }
    if(agsSelect.children.length >= 2)
        document.getElementById("agsDiv").style.display = "block";
    else
        setTown();
}

var town;

function setTown() {
    hide(false);
    var chosenAGS = document.getElementById("agsSelect").value;
    town = undefined;
    for (const t of ags) 
        if(t.AGS==chosenAGS) 
            town=t;
    if(!town)
        console.log("found no town for AGS", chosenAGS);
}


function prepareInputs() {
    hide(false);
    if(!town) return;
    land = getLand(town.AGS);
    if(!land) return;
    if(land.Land == "Hamburg") {
        document.getElementById("ham_eingaben").style.display = "block";
        //document.getElementById("ham_hebesatz").value = 100*town.Hebesatz; // TODO
    } else if(land.Land == "Baden-Württemberg") {
        document.getElementById("bw_eingaben").style.display = "block";
        //document.getElementById("bw_hebesatz").value = 100*town.Hebesatz; // TODO
    } else if(land.Land == "Bayern") {
        document.getElementById("bayern_eingaben").style.display = "block";
        //document.getElementById("bayern_hebesatz").value = 100*town.Hebesatz; // TODO
    } else if(land.Land == "Hessen") {
        document.getElementById("hes_eingaben").style.display = "block";
        //document.getElementById("hes_hebesatz").value = 100*town.Hebesatz; // TODO
    } else {
        document.getElementById("eingaben").style.display = "block";
        //document.getElementById("hebesatz").value = 100*town.Hebesatz;
    }
}

function showApartmentQuestion() {
    let answer = document.getElementById('house_type').value;
    let checkbox = document.getElementById('apartmentQuestion');
    if(answer=="MFH" || answer=="WEG")
        checkbox.style.display = "inline";
    else
        checkbox.style.display = "none";

}

function show_ham_question(el) {
    let question = document.getElementById('ham_usage_question');
    if(el.checked)
        question.style.display = "none";
    else
        question.style.display = "inline";
}

function createReport(){
    var report = document.getElementById("report");
    report.style.display = "none";
    if(!town) return;
    var land = getLand(town.AGS); // first two digits of AGS
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
    var tax_non_relocatable = bewirtschaftungskosten(remaining_usage_capped, house_type); // T
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
    let some_factor = (land.Land=="Sachsen") ? 0.00036 : 0.00034;
    if(house_type == "MFH" && social)
        some_factor *= 0.75; // 25% less
    let annual_tax = object_worth * increase * some_factor;

    document.getElementById("land").innerHTML = land.Land;
    document.getElementById("gemeinde").innerHTML = town.Gemeinde;
    document.getElementById("ags").innerHTML = town.AGS;
    document.getElementById("tax").innerHTML = floor_2(annual_tax);
    report.style.display = "block";
}

function createReportHamburg() {
    let for_living = document.getElementById("ham_zweck").checked;
    let location = document.getElementById("ham_wohnlage").value;
    let area_total = Number(document.getElementById("ham_area_total").value); 
    let area_indoor = Number(document.getElementById("ham_area_indoor").value);
    let area_use = Number(document.getElementById("ham_area_use").value);
    let increase = Number(document.getElementById("ham_hebesatz").value)/100;

    let result = 0;
    result += area_total * 0.02; // E15
    result += area_indoor * 0.2 * (location=="gut" ? 1.00 : 0.75); // E20
    if(!for_living) result += area_use * 0.4; // E23
    let annual_tax = result * increase;

    document.getElementById("land").innerHTML = "Hamburg";
    document.getElementById("gemeinde").innerHTML = "Hamburg";
    document.getElementById("ags").innerHTML = town.AGS;
    document.getElementById("tax").innerHTML = floor_2(annual_tax);
    document.getElementById("report").style.display = "block";
}

function createReportHessen() {
    let memorial = document.getElementById("hes_memorial").checked;
    let area_total = Number(document.getElementById("hes_area_total").value); 
    let area_indoor = Number(document.getElementById("hes_area_indoor").value);
    let area_outdoor = Number(document.getElementById("hes_area_outdoor").value);
    let ground_value = Number(document.getElementById("hes_ground_value").value);
    let ground_value_avg = Number(document.getElementById("hes_ground_value_avg").value);
    let increase = Number(document.getElementById("hes_hebesatz").value)/100;

    // Flaechenbetraege
    let summand1 = area_total * 0.04;
    let summand2 = area_indoor * 0.5 * (memorial ? 0.525 : 0.7);
    let summand3 = area_outdoor * 0.5 * (memorial ? 0.75 : 1.0);
    let summed = Math.floor(summand1 + summand2 + summand3);

    let factor = floor2(Math.pow(ground_value / ground_value_avg, 0.3));

    // Steuermessbetrag
    let result = Math.floor(summed * factor);

    let annual_tax = result * increase;

    document.getElementById("land").innerHTML = "Hessen";
    document.getElementById("gemeinde").innerHTML = town.Gemeinde;
    document.getElementById("ags").innerHTML = town.AGS;
    document.getElementById("tax").innerHTML = floor_2(annual_tax);
    document.getElementById("report").style.display = "block";
}

function createReportBW() {
    let area = Number(document.getElementById("bw_area").value); 
    let owner_type = document.getElementById("bw_owner_type").value
    let for_living = document.getElementById("bw_zweck").checked;
    let b17_answered_yes = document.getElementById("bw_option1").checked || document.getElementById("bw_option2").checked;
    let increase = Number(document.getElementById("bw_hebesatz").value)/100; 
    let ground_value = Number(document.getElementById("bw_ground_value").value);
    let memorial = document.getElementById("bw_memorial").checked;

    let tax_value = area * ground_value;
    let tax_number = 0.0013;
    if(for_living) {
        tax_number *= 0.7;
        if(b17_answered_yes || (owner_type != "Privatperson"))
            tax_number *= 0.75;
    }
    if(memorial) tax_number *= 0.9;

    let annual_tax = tax_value * tax_number * increase;

    let land = getLand(town.AGS);
    document.getElementById("land").innerHTML = land.Land;
    document.getElementById("gemeinde").innerHTML = town.Gemeinde;
    document.getElementById("ags").innerHTML = town.AGS;
    document.getElementById("tax").innerHTML = floor_2(annual_tax);
    document.getElementById("report").style.display = "block";
}

function createReportBayern() {
    let area = Number(document.getElementById("bayern_area").value); 
    let area_house = Number(document.getElementById("bayern_area_house").value); 
    let area_living = Number(document.getElementById("bayern_area_living").value); 
    let increase = Number(document.getElementById("bayern_hebesatz").value)/100; 
    let memorial = document.getElementById("bayern_memorial").checked;
    let forestry = document.getElementById("bayern_forestry").checked;

    let C15 = area - 10*area_house;
    let D15 = area_house * 10;
    let ground_value = C15>0 ? D15*0.04 + C15*0.02 : area * 0.04;
    let ground_tax = round1(ground_value);

    let house_value = Math.round(area_living * 0.5);
    let tax_number = 0.7;
    if(memorial || forestry) tax_number *= 0.75; // 25% less
    let house_tax = house_value * tax_number;

    let annual_tax = (ground_tax + house_tax) * increase;

    let land = getLand(town.AGS);
    document.getElementById("land").innerHTML = land.Land;
    document.getElementById("gemeinde").innerHTML = town.Gemeinde;
    document.getElementById("ags").innerHTML = town.AGS;
    document.getElementById("tax").innerHTML = floor_2(annual_tax);
    document.getElementById("report").style.display = "block";
}

function floor_2(x) { return Math.floor(x/100)*100; }
function floor2(x) { return Math.floor(x*100)/100; }
function round_2(x) { return Math.round(x/100)*100; }
function round1(x) { return Math.round(x*10)/10; }
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
