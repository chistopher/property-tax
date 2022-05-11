
console.log(ags);
console.log(lands);
console.log(mietwert);

ags.sort((lhs, rhs) => { return lhs.Gemeinde.localeCompare(rhs.Gemeinde); });

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
    document.getElementById("ns_eingaben").style.display = "none";
    document.getElementById("intermediates").style.display = "none";
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
    let land = getLand(town.AGS);
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
    } else if(land.Land == "Niedersachsen") {
        document.getElementById("ns_eingaben").style.display = "block";
        //document.getElementById("ns_hebesatz").value = 100*town.Hebesatz; // TODO
    } else {
        document.getElementById("eingaben").style.display = "block";
        //document.getElementById("hebesatz").value = 100*town.Hebesatz;
    }
}

function showApartmentQuestion() {
    let answer = document.getElementById('house_type').value;
    let MFG_popup = document.getElementById('apartmentQuestion_num');
    let WEG_popup = document.getElementById('apartmentQuestion_fraction');
    MFG_popup.style.display = (answer=="MFH" ? "inline" : "none");
    WEG_popup.style.display = (answer=="WEG" ? "inline" : "none");
}

function createReport(){
    var report = document.getElementById("report");
    report.style.display = "none";
    if(!town) return;
    var land = getLand(town.AGS); // first two digits of AGS
    if(!land) return;

    var flats = Number(document.getElementById("wohnungen").value); // G
    var baujahr = Number(document.getElementById("baujahr").value); // H
    var area_indoor = Number(document.getElementById("area_indoor").value); // M
    var area_total = Number(document.getElementById("area_total").value); // Y
    var type_select = document.getElementById("house_type");
    var house_type = type_select.options[type_select.selectedIndex].text; // F
    let fraction_top = Number(document.getElementById("fraction1").value); // W
    let fraction_bottom = Number(document.getElementById("fraction2").value); // X
    var ground = Number(document.getElementById("ground").value); // AC
    var increase = Number(document.getElementById("hebesatz").value)/100; // AS
    var social = document.getElementById("social").checked; // AT
    let num_parking = Number(document.getElementById("parking").value); // A17
    let memorial = document.getElementById("memorial").checked; // AU

    var kennwert_land = parseInt(land.Kennwert); // E
    var kennwert_year = kennwertBaujahr(baujahr); // I
    var kennwert_house_rent = kennwertHouse(house_type)[0]; // Z
    var kennwert_house_raw = kennwertHouse(house_type)[1]; // AA
    var kennwert_area = kennwertArea(area_indoor); // O

    var mietstufe = parseInt(town.Mietenstufe); // J

    var value_avg_rent1 = mietwert[kennwert_land+kennwert_house_rent+kennwert_area][kennwert_year-2]; // K
    var mietstufen_factor = [0.775, 0.9, 1.0, 1.1, 1.2, 1.325]; // Miete + Zu-/Abschlag Mietstufe Anlage 13 Anlage 39 (zu § 254 Absatz 2) II.
    var value_avg_rent2 = mietstufen_factor[mietstufe-1] * value_avg_rent1; // L

    var interest = kapitalisierung(house_type == "MFH" ? flats : ground, house_type); // P
    // Anlage 12 Anlage 38 (zu § 253 Absatz 2 und 259 Absatz 4)
    let remaining_usage = Math.max(0, 80-(2022-baujahr)); // Q
    // §258 (2)
    var remaining_usage_capped = Math.max(24, remaining_usage); // R
    var kennwert_usage = remaining_usage_capped - 22; // S
    // Anlage 14 Anlage 40 (zu § 255 Absatz 2)
    var tax_non_relocatable = bewirtschaftungskosten(remaining_usage_capped, house_type); // U
    var annual_raw = 12 * area_indoor * value_avg_rent2 + num_parking * 35; // AJ
    var non_relocatable_cost = annual_raw * (tax_non_relocatable / 100); // V
    // Anlage 10 Anlage 36 (zu § 251 und § 257 Absatz 1)
    var coefficient = umrechnungskoeffizient(area_total, house_type); // AH
    var ground_value = area_total * ground * coefficient; // AI
    if(house_type=="WEG") ground_value *= fraction_top / fraction_bottom;

    var annual_clean = annual_raw - non_relocatable_cost; // AK
    var tax_factor = round3(1 + interest/100); // AL
    // Anlage 11 Anlage 37 (zu § 253 Absatz 2)
    // (1/(AJ18^Q18))*(((AJ18^Q18)-1)/(AJ18-1))
    var aj_q = Math.pow(tax_factor,remaining_usage_capped);
    var multiplier = (1/aj_q)*((aj_q-1)/(tax_factor-1)); // AM
    // Anlage 15 Anlage 41 (zu § 257 Absatz 2)
    var detaxinator = round4(1/aj_q); // AN
    var interesting_ground = round2(ground_value * detaxinator); // AO
    var cash_clean = round2(annual_clean*multiplier); // AP
    var min_value = round_2(ground * area_total*0.75); // AQ
    var object_worth = Math.max(min_value, round_2(interesting_ground+cash_clean)); // AR

    // Steuermesszahl: 0,34 §15 (1) 2. a)/b)
    let steuermesszahl_base = 0.00031;
    if(land.Land=="Sachsen") steuermesszahl_base = 0.00036;
    if(land.Land=="Saarland") steuermesszahl_base = 0.00034;
    let some_factor = (1.0 - 0.25 * social - 0.1*memorial) * steuermesszahl_base;
    let result = object_worth * some_factor;
    let annual_tax = result * increase;

    showReport(result, annual_tax, 
       `jährlicher Rohertrag ${floor2(annual_raw)}</br>
        nicht umlagefähige Bewirtschaftungskosten ${floor2(non_relocatable_cost)}</br>
        jährlicher Reinertrag ${floor2(annual_clean)}</br>
        Vervielfältiger ${floor2(multiplier)}</br>
        Barwert des Reinertrags ${floor2(cash_clean)}</br>
        abgezinster Bodenwert ${floor2(interesting_ground)}</br>`);
}

function createReportHamburg() {
    let denkmal = document.getElementById("ham_denk").checked;
    let location = document.getElementById("ham_wohnlage").value;
    let area_total = Number(document.getElementById("ham_area_total").value); 
    let area_house = Number(document.getElementById("ham_area_house").value);
    let increase = Number(document.getElementById("ham_hebesatz").value)/100;

    let A16 = 10*area_house < area_total ? 10*area_house : 0;
    let A17 = area_total - A16;
    let equiv_num = 0.5*0.7;
    if(denkmal) equiv_num *= 0.75;
    if(location=="normal") equiv_num *= 0.75;
    let G17 = floor1(A16>0 ? A16*0.04+A17*0.02 : A17*0.04); // total area tax
    let G22 = Math.floor(area_house * equiv_num); // house area tax

    let result = G17 + G22;
    let annual_tax = result * increase;

    showReport(result, annual_tax, `Bodenwert ${G17}</br>Gebäudewert ${G22}`);
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
    let summed = summand1 + summand2 + summand3;

    let factor = floor2(Math.pow(ground_value / ground_value_avg, 0.3));

    // Steuermessbetrag
    let result = summed * factor;

    let annual_tax = result * increase;

    showReport(result, annual_tax, "");
}


function createReportNiedersachsen() {
    let ground_value = Number(document.getElementById("ns_ground_value").value);
    let ground_value_avg = Number(document.getElementById("ns_ground_value_avg").value);
    let area_total = Number(document.getElementById("ns_area_total").value); 
    let area_indoor = Number(document.getElementById("ns_area_indoor").value);
    let area_outdoor = Number(document.getElementById("ns_area_outdoor").value);
    let increase = Number(document.getElementById("ns_hebesatz").value)/100;

    let lage_factor = floor2(Math.pow(ground_value / ground_value_avg, 0.3));

    let H7 = 10*area_indoor < area_total ? 10*area_indoor : 0;
    let I7 = area_total-H7;
    // = ROUNDDOWN(IF(H7>0,(H7*0.04+I7*0.02)*F7,I7*0.04*F7),0) 
    let L7 = Math.floor(lage_factor * (H7>0 ? H7*0.04 + I7*0.02 : I7*0.04)); // Messbetrag Grund und Boden
    let M7 = Math.floor(area_indoor * 0.5 * 0.7 * lage_factor); // Messbetrag Wohnfläche
    let N7 = area_outdoor * 0.5 * lage_factor;  // Messbetrag Nichtwohnfläche

    let result = L7 + M7 + N7;  // = Grundsteuermessbetrag (GMB)
    let annual_tax = result * increase;

    showReport(result, annual_tax, "");
}

function createReportBW() {
    let area = Number(document.getElementById("bw_area").value); 
    let for_living = document.getElementById("bw_zweck").checked;
    let b17_answered_yes = document.getElementById("bw_option1").checked || document.getElementById("bw_option2").checked;
    let increase = Number(document.getElementById("bw_hebesatz").value)/100; 
    let ground_value = Number(document.getElementById("bw_ground_value").value);
    let memorial = document.getElementById("bw_memorial").checked;

    let tax_value = area * ground_value;
    let tax_number = 0.0013;
    let reduction = 0;
    if(for_living) reduction += 0.3;
    if(b17_answered_yes) reduction += 0.25;
    if(memorial) reduction += 0.1;
    tax_number *= (1-reduction);

    let result = tax_value * tax_number;
    let annual_tax = result * increase;

    showReport(result,annual_tax,"");
}

function createReportBayern() {
    let area_total = Number(document.getElementById("bayern_area").value); 
    let area_house = Number(document.getElementById("bayern_area_house").value); 
    let increase = Number(document.getElementById("bayern_hebesatz").value)/100; 
    let memorial = document.getElementById("bayern_memorial").checked;
    let forestry = document.getElementById("bayern_forestry").checked;
    let social = document.getElementById("bayern_social").checked;

    let C15 = 10*area_house < area_total ? 10*area_house : 0;
    let D15 = area_total - C15;

    // =IF(C15>0,ROUNDDOWN(D15*0.02+C15*0.04,1),ROUNDDOWN(B15*0.04,1))
    let ground_value = floor1(C15>0 ? D15*0.02 + C15*0.04 : area_total * 0.04);
    let house_value = Math.floor(area_house * 0.5) * 0.7;
    if(memorial) house_value *= 0.75;
    if(forestry) house_value *= 0.75;
    if(social) house_value *= 0.75;
    house_value = Math.floor(house_value);


    let result = ground_value + house_value;
    let annual_tax = result * increase;

    showReport(result, annual_tax,
        `Grundsteuermessbetrag Boden ${ground_value}</br>
        Grundsteuermessbetrag Gebäude ${house_value}`);
}

function showReport(pretax, annual_tax, intermediates) {
    let land = getLand(town.AGS);
    document.getElementById("land").innerHTML = land.Land;
    document.getElementById("gemeinde").innerHTML = town.Gemeinde;
    document.getElementById("ags").innerHTML = town.AGS;
    document.getElementById("pretax").innerHTML = floor2(pretax);
    document.getElementById("tax").innerHTML = floor2(annual_tax);
    document.getElementById("report").style.display = "block";
    if(!intermediates) return;
    document.getElementById("intermediates").style.display = "block";
    document.getElementById("intermediate_values").innerHTML = intermediates;
}

function floor_2(x) { return Math.floor(x/100)*100; }
function floor1(x) { return Math.floor(x*10)/10; }
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
