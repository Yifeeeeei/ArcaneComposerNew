// this is where we define our filters
// a filter filts throught the displaying_card_infos and returns a new array of card_infos

function split_filters() {
    // remove all blank spaces
    input_filter = input_filter.replaceAll("；", ";");
    input_filter = input_filter.replaceAll("，", ",");
    input_filter = input_filter.replaceAll("：", ":");
    input_filter = input_filter.replaceAll("？", "?");
    input_filter = input_filter.replaceAll(/\s/g, "");
    let filters = input_filter.split(";");
    // delete empty filters
    for (let i = 0; i < filters.length; i++) {
        if (filters[i] == "") {
            filters.splice(i, 1);
            i--;
        }
    }
    console.log(filters);
    basic_filters = [];
    superior_filters = {};
    superior_filter_keywords = ["elem", "type", "cost", "version"];
    keyword_filter_keywords = ["update"];
    keyword_filters = [];
    for (let i = 0; i < filters.length; i++) {
        const filter_options = filters[i].split(",").filter(function (item) {
            return item != "";
        });
        if (
            filters[i].includes(":") &&
            superior_filter_keywords.includes(filters[i].split(":")[0])
        ) {
            // this is a superior filter
            let key = filters[i].split(":")[0];
            let value = filters[i].split(":")[1].split(",").filter(function (item) {
                return item != "";
            });
            if (superior_filters[key] == undefined && value.length > 0) {
                superior_filters[key] = value;
            }
        } else if (keyword_filter_keywords.includes(filters[i])) {
            keyword_filters.push(filters[i]);
        } else {
            // this is a basic filter
            if (filter_options.length > 0) {
                basic_filters.push(filter_options);
            }
        }
    }
    return [basic_filters, keyword_filters, superior_filters];
}

function get_card_features(card_info) {
    let features = [];
    features.push(card_info.number.toString());
    features.push(card_info.name);
    features.push(card_info.tag);
    features.push(card_info.description);
    return features;
}

function does_card_satisfy_basic_filter(card_info, basic_filter) {
    let features = get_card_features(card_info);
    for (let option_idx = 0; option_idx < basic_filter.length; option_idx++) {
        if (
            basic_filter[option_idx] === "update" &&
            update_card_numbers.includes(card_info.number)
        ) {
            return true;
        }
        for (let i = 0; i < features.length; i++) {
            if (features[i].includes(basic_filter[option_idx])) {
                return true;
            }
        }
    }
    return false;
}

function category_filter(card_info, superior_filters) {
    if (
        superior_filters.elem != undefined &&
        !superior_filters.elem.includes(card_info.category)
    ) {
        return false;
    }
    return true;
}
function type_filter(card_info, superior_filters) {
    if (
        superior_filters.type != undefined &&
        !superior_filters.type.includes(card_info.type)
    ) {
        return false;
    }
    return true;
}
function cost_filter(card_info, superior_filters) {
    if (superior_filters.cost == undefined) {
        return true;
    }

    let card_cost = 0;
    for (let i = 0; i < Object.keys(card_info.elements_cost).length; i++) {
        const key = Object.keys(card_info.elements_cost)[i];
        card_cost += card_info.elements_cost[key];
    }
    // console.log(card_cost, superior_filters);
    if (
        !superior_filters.cost.some(function (cost) {
            return parseInt(cost) == card_cost;
        })
    ) {
        return false;
    }
    return true;
}

function version_filter(card_info, superior_filters) {
    if (
        superior_filters.version == undefined ||
        superior_filters.version.includes(card_info.version_name)
    ) {
        return true;
    }
    return false;
}

function does_card_satisfy_superior_filters(card_info, superior_filters) {
    if (!category_filter(card_info, superior_filters)) {
        return false;
    }
    if (!type_filter(card_info, superior_filters)) {
        return false;
    }
    if (!cost_filter(card_info, superior_filters)) {
        return false;
    }
    if (!version_filter(card_info, superior_filters)) {
        return false;
    }
    return true;
}

function keyword_update_filter(card_info, keyword_filters) {
    if (keyword_filters.includes("update")) {
        if (!update_card_numbers.includes(card_info.number)) {
            return false;
        }
    }
    return true;
}

function does_card_satisfy_keyword_filters(card_info, keyword_filters) {
    if (!keyword_update_filter(card_info, keyword_filters)) {
        return false;
    }
    return true;
}

function filter_all() {
    // get the input value
    input_filter = document.getElementById("input_filter").value;
    const splited = split_filters();
    const basic_filters = splited[0];
    const keyword_filters = splited[1];
    const superior_filters = splited[2];
    displaying_card_infos = [];

    for (let i = 0; i < all_card_infos.length; i++) {
        let failed = false;

        // check superior filters
        if (
            !does_card_satisfy_superior_filters(
                all_card_infos[i],
                superior_filters
            )
        ) {
            failed = true;
            continue;
        }
        if (
            !does_card_satisfy_keyword_filters(
                all_card_infos[i],
                keyword_filters
            )
        ) {
            failed = true;
            continue;
        }

        // check basic filters
        for (let j = 0; j < basic_filters.length; j++) {
            if (
                !does_card_satisfy_basic_filter(
                    all_card_infos[i],
                    basic_filters[j]
                )
            ) {
                failed = true;
                break;
            }
        }
        if (!failed) {
            displaying_card_infos.push(all_card_infos[i]);
        }
    }
}
