function hello_utils() {
    console.log("Hello from utils.js");
}

function set_up_initial_deck_code() {
    const urlParams = new URLSearchParams(window.location.search);
    const deck_code = urlParams.get("code");
    if (deck_code) {
        input_deck_code.value = deck_code;
        onclick_button_build();
    }
}

function encode(numbers) {
    // join by space
    let encoded = numbers.join(" ");
    return encoded;
}

function decode(encoded) {
    let numbers = [];
    encoded = encoded.replaceAll("//", " ");

    numbers = encoded.split(/(\s+)/).filter(function (e) {
        return e.trim().length > 0;
    });

    for (let i = 0; i < numbers.length; i++) {
        if (!is_new_card_schema) {
            const parsed = parseInt(numbers[i], 10);
            if (Number.isNaN(parsed)) {
                alert("Invalid deck code: " + numbers[i] + " is not a number!");
                numbers.splice(i, 1);
                i--;
                continue;
            }
            numbers[i] = parsed;
        }
    }
    return numbers;
}

// this function will display all cards in displaying_card_infos onto the page
function show_cards() {
    document.getElementById("collections_list").innerHTML = "";
    sync_card_grid_layout();
    sort_displaying_cards();

    for (let i = 0; i < displaying_card_infos.length; i++) {
        const card_info = displaying_card_infos[i];
        let card_ele = get_card_element_by_card_info(card_info, i);
        card_ele.setAttribute("idx", i);
        document.getElementById("collections_list").appendChild(card_ele);
    }
}

function get_card_total_cost(card_info) {
    if (card_info && card_info.mana_cost !== undefined) {
        return card_info.mana_cost === null ? 0 : Number(card_info.mana_cost);
    }
    if (!card_info.elements_cost) {
        return 0;
    }
    let totalCost = 0;
    const costKeys = Object.keys(card_info.elements_cost);
    for (let i = 0; i < costKeys.length; i++) {
        totalCost += card_info.elements_cost[costKeys[i]];
    }
    return totalCost;
}

function compare_cards_by_number(a, b) {
    // hero cards goes first, than number
    if (a.number[0] == 4 && b.number[0] == 4) {
        return String(a.number).localeCompare(String(b.number), undefined, {
            numeric: true,
        });
    } else if (a.number[0] == 4) {
        return -1;
    } else if (b.number[0] == 4) {
        return 1;
    }
    return String(a.number).localeCompare(String(b.number), undefined, {
        numeric: true,
    });
}

function sort_displaying_cards() {
    if (card_pool_sort_mode === "cost_asc") {
        displaying_card_infos.sort((a, b) => {
            return get_card_total_cost(a) - get_card_total_cost(b) || compare_cards_by_number(a, b);
        });
        return;
    }
    if (card_pool_sort_mode === "cost_desc") {
        displaying_card_infos.sort((a, b) => {
            return get_card_total_cost(b) - get_card_total_cost(a) || compare_cards_by_number(a, b);
        });
        return;
    }
    displaying_card_infos.sort(compare_cards_by_number);
}

function set_card_pool_sort_mode(sortMode) {
    card_pool_sort_mode = sortMode;
    update_card_pool_sort_buttons();
    if (!Array.isArray(displaying_card_infos)) {
        return;
    }
    show_cards();
}

function update_card_pool_sort_buttons() {
    const sortButtons = document.querySelectorAll("[data-card-pool-sort]");
    sortButtons.forEach(function (button) {
        const isActive = button.dataset.cardPoolSort === card_pool_sort_mode;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function sync_card_grid_layout() {
    const collectionsList = document.getElementById("collections_list");
    if (!collectionsList) {
        return;
    }
    document.documentElement.style.setProperty("--card-width", card_width);
    const isMobile = window.matchMedia(
        "(max-width: 900px), (max-aspect-ratio: 3/4)"
    ).matches;
    if (isMobile) {
        collectionsList.style.gridTemplateColumns =
            "repeat(2, minmax(0, 1fr))";
        return;
    }
    collectionsList.style.gridTemplateColumns = `repeat(auto-fill, minmax(${card_width}, 1fr))`;
}

function mouseover_card_name_element(event) {
    popup_img.setAttribute("src", event.target.getAttribute("img_src"));
    show_element(popup_img);
}
function mouseout_card_name_element(event) {
    hide_element(popup_img);
}

function check_deck() {
    check_result = {
        hero: true,
        main: true,
        ability: true,
        warning_numbers: [],
    };
    // check hero
    if (current_deck["hero"].length > 1) {
        check_result["hero"] = false;
    }
    // check main
    note = {};
    const mainDeckLimit = 30;
    if (current_deck["main"].length > mainDeckLimit) {
        check_result["main"] = false;
    }
    for (let i = 0; i < current_deck["main"].length; i++) {
        number = current_deck["main"][i].number;
        max_number_to_carry = parseInt(number[2]);
        if (number in note) {
            note[number] += 1;
        } else {
            note[number] = 1;
        }
        if (note[number] > max_number_to_carry) {
            check_result["main"] = false;
            check_result["warning_numbers"].push(number);
        }
    }

    // check ability
    // 1. you cannot have two abilities with the same number
    // 2. you cannot have more than 10 abilities
    // 3. you cannot have more than 1 legendary ability
    if (current_deck["ability"].length > 10) {
        check_result["ability"] = false;
    }
    has_legendary_ability = false;
    note = {};
    carried_legends = [];
    for (let i = 0; i < current_deck["ability"].length; i++) {
        number = current_deck["ability"][i].number;
        max_number_to_carry = 1;
        if (number in note) {
            note[number] += 1;
        } else {
            note[number] = 1;
        }
        if (note[number] > max_number_to_carry) {
            check_result["ability"] = false;
            check_result["warning_numbers"].push(number);
        }

        if (is_legend(current_deck["ability"][i])) {
            carried_legends.push(number);
            if (has_legendary_ability) {
                check_result["ability"] = false;
                // add all numbers in carried_legends to warning_numbers
                check_result["warning_numbers"] =
                    check_result["warning_numbers"].concat(carried_legends);
            }
            has_legendary_ability = true;
        }
    }

    return check_result;
}

function show_decks() {
    const deck_elements = [deck_hero, deck_main, deck_ability, deck_extra];
    const deck_list = ["hero", "main", "ability", "extra"];
    check_result = check_deck();
    for (let i = 0; i < deck_list.length; i++) {
        deck_elements[i].innerHTML = "";
        for (let j = 0; j < current_deck[deck_list[i]].length; j++) {
            const card_info = current_deck[deck_list[i]][j];
            let deck_card_container = document.createElement("div");
            deck_card_container.className = "deck_card_container";

            let card_name_ele = document.createElement("div");
            card_name_ele.setAttribute("idx", j);
            card_name_ele.setAttribute("card_number", card_info.number);
            card_name_ele.setAttribute("img_src", get_image_src(card_info));
            card_name_ele.innerHTML = card_info.name;
            card_name_ele.onclick = onclick_element_show_detail;
            card_name_ele.addEventListener(
                "mouseover",
                mouseover_card_name_element
            );
            card_name_ele.addEventListener(
                "mouseout",
                mouseout_card_name_element
            );

            if (is_legend(card_info)) {
                card_name_ele.innerHTML += " ✡";
            }
            card_name_ele.className = "deck_card";
            if (check_result["warning_numbers"].includes(card_info.number)) {
                console.log("warning");
                card_name_ele.classList.add("warning");
            }
            deck_card_container.appendChild(card_name_ele);
            let deck_minus_button = document.createElement("button");
            deck_minus_button.innerHTML = "-";
            deck_minus_button.className = "deck_minus_button";
            deck_minus_button.setAttribute("deck_name", deck_list[i]);
            deck_minus_button.setAttribute("idx", j);
            deck_minus_button.onclick = onclick_deck_minus_button;

            deck_card_container.appendChild(deck_minus_button);

            deck_elements[i].appendChild(deck_card_container);
        }
    }

    document.getElementById("hero_header").innerHTML =
        "<strong>" + "人物 " + current_deck["hero"].length + "/1" + "</strong>";
    if (check_result["hero"]) {
        if (
            document.getElementById("hero_header").classList.contains("warning")
        ) {
            document.getElementById("hero_header").classList.remove("warning");
        }
    } else {
        if (
            !document
                .getElementById("hero_header")
                .classList.contains("warning")
        ) {
            document.getElementById("hero_header").classList.add("warning");
        }
    }

    document.getElementById("main_header").innerHTML =
        "<strong>" +
        "主要卡组 " +
        current_deck["main"].length +
        "/" +
        30 +
        "</strong>";
    if (check_result["main"]) {
        if (
            document.getElementById("main_header").classList.contains("warning")
        ) {
            document.getElementById("main_header").classList.remove("warning");
        }
    } else {
        if (
            !document
                .getElementById("main_header")
                .classList.contains("warning")
        ) {
            document.getElementById("main_header").classList.add("warning");
        }
    }

    document.getElementById("ability_header").innerHTML =
        "<strong>" +
        "技能卡组 " +
        current_deck["ability"].length +
        "/10" +
        "</strong>";
    if (check_result["ability"]) {
        if (
            document
                .getElementById("ability_header")
                .classList.contains("warning")
        ) {
            document
                .getElementById("ability_header")
                .classList.remove("warning");
        }
    } else {
        if (
            !document
                .getElementById("ability_header")
                .classList.contains("warning")
        ) {
            document.getElementById("ability_header").classList.add("warning");
        }
    }
    document.getElementById("extra_header").innerHTML =
        "<strong>" +
        (is_new_card_schema ? "衍生牌 " : "额外卡组 ") +
        current_deck["extra"].length +
        "</strong>";
    show_deck_info();
}

function onclick_button_build(event) {
    const card_numbers = decode(input_deck_code.value);
    console.log(card_numbers);
    current_deck = { hero: [], main: [], ability: [], extra: [] };
    for (let i = 0; i < card_numbers.length; i++) {
        if (card_number_to_idx[card_numbers[i]] == undefined) {
            alert("Invalid deck code! " + card_numbers[i] + " is not a card!");
            continue;
        }
        const card_info = all_card_infos[card_number_to_idx[card_numbers[i]]];
        const deck = find_deck_for_card(card_info);
        current_deck[deck].push(card_info);
    }
    const imported_cards = current_deck["hero"]
        .concat(current_deck["main"])
        .concat(current_deck["ability"]);
    for (let i = 0; i < imported_cards.length; i++) {
        add_spawn_cards(imported_cards[i]);
    }
    sort_cards_by_number(current_deck["hero"]);
    sort_cards_by_number(current_deck["main"]);
    sort_cards_by_number(current_deck["ability"]);
    sort_cards_by_number(current_deck["extra"]);
    show_decks();
}

function get_current_deck_code() {
    let card_numbers = [];
    let encoded = "";
    for (let i = 0; i < current_deck["hero"].length; i++) {
        card_numbers.push(current_deck["hero"][i].number);
    }
    encoded = encode(card_numbers) + " // ";
    card_numbers = [];
    for (let i = 0; i < current_deck["main"].length; i++) {
        card_numbers.push(current_deck["main"][i].number);
    }
    encoded = encoded + encode(card_numbers) + " // ";
    card_numbers = [];
    for (let i = 0; i < current_deck["ability"].length; i++) {
        card_numbers.push(current_deck["ability"][i].number);
    }
    encoded = encoded + encode(card_numbers) + " // ";
    card_numbers = [];
    for (let i = 0; i < current_deck["extra"].length; i++) {
        card_numbers.push(current_deck["extra"][i].number);
    }
    encoded = encoded + encode(card_numbers);
    return encoded;
}

async function onclick_button_export(event) {
    const encoded = get_current_deck_code();

    input_deck_code.value = encoded;
    input_deck_code.focus();
    input_deck_code.select();

    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(encoded);
            copied = true;
        } catch (err) {
            copied = false;
        }
    }

    if (!copied) {
        try {
            copied = document.execCommand("copy");
        } catch (err) {
            copied = false;
        }
    }

    show_toast(
        copied
            ? "卡组代码已复制到剪贴板"
            : "卡组代码已生成，请手动复制输入框内容"
    );
}

function show_toast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(show_toast.timer);
    show_toast.timer = setTimeout(function () {
        toast.classList.add("hidden");
    }, 2400);
}

async function load_prebuilt_decks() {
    const listElement = document.getElementById("prebuilt_decks_list");
    if (!listElement) {
        return;
    }
    listElement.innerHTML =
        '<p class="prebuilt-decks-state">预组卡组读取中...</p>';

    const deckIndex = await readJsonFile(prebuilt_decks_url);
    if (
        !deckIndex ||
        !Array.isArray(deckIndex.decks) ||
        deckIndex.decks.length === 0
    ) {
        prebuilt_decks = [];
        listElement.innerHTML =
            '<p class="prebuilt-decks-state warning">预组卡组读取失败。</p>';
        return;
    }

    prebuilt_decks = deckIndex.decks.filter(function (deck) {
        return deck && deck.name && deck.deckCode;
    });
    prebuilt_decks_loaded = true;
    render_prebuilt_decks();
}

function get_prebuilt_deck_path(deck) {
    if (deck.id) {
        return deck.id.split("/").filter(function (item) {
            return item !== "";
        });
    }
    return [deck.name];
}

function build_prebuilt_deck_tree(decks) {
    const root = {
        folders: {},
        decks: [],
    };

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i];
        const pathParts = get_prebuilt_deck_path(deck);
        const deckName = pathParts[pathParts.length - 1] || deck.name;
        const folderParts = pathParts.slice(0, -1);
        let cursor = root;

        for (let j = 0; j < folderParts.length; j++) {
            const folderName = folderParts[j];
            if (!cursor.folders[folderName]) {
                cursor.folders[folderName] = {
                    folders: {},
                    decks: [],
                };
            }
            cursor = cursor.folders[folderName];
        }

        cursor.decks.push({
            deck: deck,
            displayName: deckName,
        });
    }

    return root;
}

function render_prebuilt_decks() {
    const listElement = document.getElementById("prebuilt_decks_list");
    if (!listElement) {
        return;
    }

    listElement.innerHTML = "";
    if (prebuilt_decks.length === 0) {
        listElement.innerHTML =
            '<p class="prebuilt-decks-state">暂无预组卡组。</p>';
        return;
    }

    const tree = build_prebuilt_deck_tree(prebuilt_decks);
    render_prebuilt_deck_tree_node(tree, listElement, 0);
}

function render_prebuilt_deck_tree_node(node, parentElement, depth) {
    const folderNames = Object.keys(node.folders).sort();
    for (let i = 0; i < folderNames.length; i++) {
        const folderName = folderNames[i];
        const folderElement = document.createElement("details");
        folderElement.className = "prebuilt-deck-folder";

        const summaryElement = document.createElement("summary");
        summaryElement.textContent = folderName;
        folderElement.appendChild(summaryElement);

        const childElement = document.createElement("div");
        childElement.className = "prebuilt-deck-folder-content";
        render_prebuilt_deck_tree_node(
            node.folders[folderName],
            childElement,
            depth + 1
        );
        folderElement.appendChild(childElement);
        parentElement.appendChild(folderElement);
    }

    node.decks.sort(function (a, b) {
        return a.displayName.localeCompare(b.displayName, "zh-CN");
    });
    for (let i = 0; i < node.decks.length; i++) {
        parentElement.appendChild(
            create_prebuilt_deck_item(node.decks[i].deck, node.decks[i].displayName)
        );
    }
}

function create_prebuilt_deck_item(deck, displayName) {
    const itemElement = document.createElement("div");
    itemElement.className = "prebuilt-deck-item";

    const infoElement = document.createElement("div");
    infoElement.className = "prebuilt-deck-info";

    const nameElement = document.createElement("strong");
    nameElement.textContent = displayName || deck.name;
    infoElement.appendChild(nameElement);

    const metaElement = document.createElement("span");
    const versions = Array.isArray(deck.version) ? deck.version : [];
    metaElement.textContent =
        versions.length > 0 ? versions.join(" / ") : "未标记版本";
    infoElement.appendChild(metaElement);

    const importButton = document.createElement("button");
    importButton.type = "button";
    importButton.textContent = "导入";
    importButton.addEventListener("click", function () {
        import_prebuilt_deck(deck);
    });

    itemElement.appendChild(infoElement);
    itemElement.appendChild(importButton);
    return itemElement;
}

function open_prebuilt_decks_selector() {
    if (!shader) {
        shader = document.getElementById("shader");
    }
    if (!prebuilt_decks_panel) {
        prebuilt_decks_panel = document.getElementById("prebuilt_decks_panel");
    }
    onclick_shader();
    show_element(prebuilt_decks_panel);
    show_element(shader);
    if (!prebuilt_decks_loaded) {
        load_prebuilt_decks();
    }
}

function close_prebuilt_decks_selector() {
    if (!shader) {
        shader = document.getElementById("shader");
    }
    hide_element(shader);
    hide_element(prebuilt_decks_panel);
}

function import_prebuilt_deck(deck) {
    if (!deck || !deck.deckCode) {
        return;
    }
    input_deck_code.value = deck.deckCode;
    onclick_button_build();
    close_prebuilt_decks_selector();
    show_toast("已导入预组：" + deck.name);
}

function setup_local_decks() {
    local_decks_panel = document.getElementById("local_decks_panel");
    local_decks_list = document.getElementById("local_decks_list");
    local_deck_name_input = document.getElementById("local_deck_name_input");
    if (local_deck_name_input && !local_deck_name_input.dataset.saveBound) {
        local_deck_name_input.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                save_current_deck_to_local();
            }
        });
        local_deck_name_input.dataset.saveBound = "true";
    }
    local_decks = get_local_decks();
    render_local_decks();
}

function get_local_decks() {
    try {
        const rawDecks = localStorage.getItem(local_decks_storage_key);
        const parsedDecks = JSON.parse(rawDecks || "[]");
        if (!Array.isArray(parsedDecks)) {
            return [];
        }
        return parsedDecks
            .map(function (deck) {
                if (
                    !deck ||
                    typeof deck.name !== "string" ||
                    typeof deck.deckCode !== "string"
                ) {
                    return null;
                }
                const name = deck.name.trim();
                const deckCode = deck.deckCode.trim();
                if (name === "" || deckCode === "") {
                    return null;
                }
                return {
                    id:
                        typeof deck.id === "string" && deck.id !== ""
                            ? deck.id
                            : "local-" + Date.now().toString(),
                    name: name,
                    deckCode: deckCode,
                    updatedAt:
                        typeof deck.updatedAt === "number"
                            ? deck.updatedAt
                            : Date.now(),
                };
            })
            .filter(function (deck) {
                return deck !== null;
            })
            .slice(0, local_decks_limit);
    } catch (err) {
        return [];
    }
}

function persist_local_decks() {
    try {
        localStorage.setItem(
            local_decks_storage_key,
            JSON.stringify(local_decks.slice(0, local_decks_limit))
        );
        return true;
    } catch (err) {
        show_toast("本地卡组保存失败，请检查浏览器存储权限");
        return false;
    }
}

function get_current_deck_card_count() {
    return (
        current_deck.hero.length +
        current_deck.main.length +
        current_deck.ability.length +
        current_deck.extra.length
    );
}

function open_local_decks_panel() {
    if (!shader) {
        shader = document.getElementById("shader");
    }
    if (!local_decks_panel) {
        setup_local_decks();
    }
    onclick_shader();
    render_local_decks();
    show_element(local_decks_panel);
    show_element(shader);
}

function close_local_decks_panel() {
    if (!shader) {
        shader = document.getElementById("shader");
    }
    hide_element(shader);
    hide_element(local_decks_panel);
}

function save_current_deck_to_local() {
    if (!local_deck_name_input) {
        setup_local_decks();
    }
    const name = local_deck_name_input.value.trim();
    if (name === "") {
        show_toast("请先给当前卡组命名");
        return;
    }
    if (get_current_deck_card_count() === 0) {
        show_toast("当前没有可存储的卡组");
        return;
    }

    const deckCode = get_current_deck_code();
    const now = Date.now();
    const existingIndex = local_decks.findIndex(function (deck) {
        return deck.name === name;
    });
    const storedDeck = {
        id:
            existingIndex >= 0
                ? local_decks[existingIndex].id
                : "local-" + now.toString(),
        name: name,
        deckCode: deckCode,
        updatedAt: now,
    };

    if (existingIndex >= 0) {
        local_decks.splice(existingIndex, 1);
    }
    local_decks.unshift(storedDeck);
    local_decks = local_decks.slice(0, local_decks_limit);
    if (!persist_local_decks()) {
        return;
    }
    render_local_decks();
    show_toast("已存储本地卡组：" + name);
}

function render_local_decks() {
    if (!local_decks_list) {
        return;
    }
    local_decks = get_local_decks();
    local_decks_list.innerHTML = "";
    if (local_decks.length === 0) {
        local_decks_list.innerHTML =
            '<p class="prebuilt-decks-state">暂无本地卡组。</p>';
        return;
    }

    for (let i = 0; i < local_decks.length; i++) {
        local_decks_list.appendChild(create_local_deck_item(local_decks[i]));
    }
}

function create_local_deck_item(deck) {
    const itemElement = document.createElement("div");
    itemElement.className = "prebuilt-deck-item local-deck-item";

    const infoElement = document.createElement("div");
    infoElement.className = "prebuilt-deck-info";

    const nameElement = document.createElement("strong");
    nameElement.textContent = deck.name;
    infoElement.appendChild(nameElement);

    const metaElement = document.createElement("span");
    metaElement.textContent = "保存于 " + format_local_deck_time(deck.updatedAt);
    infoElement.appendChild(metaElement);

    const actionsElement = document.createElement("div");
    actionsElement.className = "local-deck-actions";

    const importButton = document.createElement("button");
    importButton.type = "button";
    importButton.textContent = "导入";
    importButton.addEventListener("click", function () {
        import_local_deck(deck);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", function () {
        delete_local_deck(deck.id);
    });

    actionsElement.appendChild(importButton);
    actionsElement.appendChild(deleteButton);
    itemElement.appendChild(infoElement);
    itemElement.appendChild(actionsElement);
    return itemElement;
}

function format_local_deck_time(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return "未知时间";
    }
    return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function import_local_deck(deck) {
    if (!deck || !deck.deckCode) {
        return;
    }
    input_deck_code.value = deck.deckCode;
    onclick_button_build();
    close_local_decks_panel();
    show_toast("已导入本地卡组：" + deck.name);
}

function delete_local_deck(deckId) {
    const deck = local_decks.find(function (item) {
        return item.id === deckId;
    });
    if (!deck) {
        return;
    }
    if (!window.confirm("删除本地卡组「" + deck.name + "」？")) {
        return;
    }
    local_decks = local_decks.filter(function (item) {
        return item.id !== deckId;
    });
    if (!persist_local_decks()) {
        return;
    }
    render_local_decks();
    show_toast("已删除本地卡组：" + deck.name);
}

function get_filter_history() {
    try {
        const rawHistory = localStorage.getItem(filter_history_storage_key);
        const parsedHistory = JSON.parse(rawHistory || "[]");
        if (Array.isArray(parsedHistory)) {
            return parsedHistory
                .map(function (item) {
                    if (typeof item === "string") {
                        return {
                            text: item.trim(),
                            favorite: false,
                        };
                    }
                    if (
                        item &&
                        typeof item.text === "string" &&
                        item.text.trim() !== ""
                    ) {
                        return {
                            text: item.text.trim(),
                            favorite: item.favorite === true,
                        };
                    }
                    return null;
                })
                .filter(function (item) {
                    return item != null && item.text !== "";
                });
        }
    } catch (err) {
        console.warn("Unable to read filter history:", err);
    }
    return [];
}

function sort_filter_history(history) {
    return history.sort(function (a, b) {
        if (a.favorite !== b.favorite) {
            return a.favorite ? -1 : 1;
        }
        return 0;
    });
}

function trim_filter_history(history) {
    while (history.length > filter_history_limit) {
        let removeIndex = -1;
        for (let i = history.length - 1; i >= 0; i--) {
            if (!history[i].favorite) {
                removeIndex = i;
                break;
            }
        }
        if (removeIndex === -1) {
            history.splice(filter_history_limit);
            break;
        }
        history.splice(removeIndex, 1);
    }
    return history;
}

function persist_filter_history(history) {
    try {
        localStorage.setItem(
            filter_history_storage_key,
            JSON.stringify(trim_filter_history(sort_filter_history(history)))
        );
    } catch (err) {
        console.warn("Unable to save filter history:", err);
    }
}

function save_filter_to_history(filterText) {
    const normalizedFilter = filterText.trim();
    if (normalizedFilter === "") {
        return;
    }
    const currentHistory = get_filter_history();
    let existingItem = null;
    const nextHistory = currentHistory.filter(function (item) {
        if (item.text === normalizedFilter) {
            existingItem = item;
            return false;
        }
        return true;
    });
    nextHistory.unshift({
        text: normalizedFilter,
        favorite: existingItem ? existingItem.favorite : false,
    });
    persist_filter_history(nextHistory);
}

function toggle_filter_history_favorite(filterText) {
    const history = get_filter_history();
    for (let i = 0; i < history.length; i++) {
        if (history[i].text === filterText) {
            history[i].favorite = !history[i].favorite;
            persist_filter_history(history);
            render_filter_history();
            return;
        }
    }
}

function hide_filter_history() {
    const menu = document.getElementById("filter_history_menu");
    hide_element(menu);
}

function render_filter_history() {
    const input = document.getElementById("input_filter");
    const menu = document.getElementById("filter_history_menu");
    if (!input || !menu) {
        return;
    }

    const currentText = input.value.trim();
    const history = get_filter_history().filter(function (item) {
        return currentText === "" || item.text.includes(currentText);
    });

    menu.innerHTML = "";
    if (history.length === 0) {
        hide_filter_history();
        return;
    }

    for (let i = 0; i < history.length; i++) {
        const itemRow = document.createElement("div");
        itemRow.className = "filter-history-row";

        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.className = "filter-history-favorite";
        favoriteButton.classList.toggle("active", history[i].favorite);
        favoriteButton.textContent = history[i].favorite ? "★" : "☆";
        favoriteButton.title = history[i].favorite ? "取消收藏" : "收藏";
        favoriteButton.setAttribute(
            "aria-label",
            history[i].favorite ? "取消收藏" : "收藏"
        );
        favoriteButton.addEventListener("mousedown", function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggle_filter_history_favorite(history[i].text);
        });

        const itemButton = document.createElement("button");
        itemButton.type = "button";
        itemButton.className = "filter-history-item";
        itemButton.textContent = history[i].text;
        itemButton.addEventListener("mousedown", function (event) {
            event.preventDefault();
            input.value = history[i].text;
            hide_filter_history();
            button_filter_clicked();
        });

        itemRow.appendChild(favoriteButton);
        itemRow.appendChild(itemButton);
        menu.appendChild(itemRow);
    }
    show_element(menu);
}

function setup_filter_history(input) {
    if (!input) {
        return;
    }
    input.addEventListener("focus", render_filter_history);
    input.addEventListener("input", render_filter_history);
    input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            hide_filter_history();
        }
    });
    document.addEventListener("mousedown", function (event) {
        const menu = document.getElementById("filter_history_menu");
        if (
            menu &&
            !menu.contains(event.target) &&
            event.target !== input
        ) {
            hide_filter_history();
        }
    });
}

function onclick_deck_minus_button(event) {
    const deck_name = event.target.getAttribute("deck_name");
    const idx = event.target.getAttribute("idx");
    current_deck[deck_name].splice(idx, 1);
    show_decks();
}

function sort_cards_by_number(card_infos) {
    card_infos.sort((a, b) => {
        return String(a.number).localeCompare(String(b.number), undefined, {
            numeric: true,
        });
    });
}

async function readJsonFile(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            // throw new Error("Network response was not ok");
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error reading the JSON file:", error);
        return null;
    }
}

async function readTextFile(textPath) {
    try {
        const response = await fetch(textPath);
        if (!response.ok) {
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error("Error reading the text file:", error);
        return null;
    }
}

function hash_text(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}

async function setup_update_notice() {
    update_notice_button = document.getElementById("update_notice_button");
    update_notice_panel = document.getElementById("update_notice_panel");
    update_notice_body = document.getElementById("update_notice_body");

    if (!update_notice_button || !update_notice_panel || !update_notice_body) {
        return;
    }

    const noticeText = await readTextFile(
        "https://raw.githubusercontent.com/Yifeeeeei/ArcaneImages/main/update.txt"
    );

    if (noticeText == null || noticeText.trim() === "") {
        update_notice_body.textContent = "暂无更新公告。";
        update_notice_button.classList.remove("has-unread");
        return;
    }

    update_notice_body.textContent = noticeText.trim();
    update_notice_hash = hash_text(noticeText);

    try {
        if (localStorage.getItem("arcane_update_notice_read") !== update_notice_hash) {
            update_notice_button.classList.add("has-unread");
        }
    } catch (err) {
        update_notice_button.classList.add("has-unread");
    }
}

function open_update_notice() {
    if (!shader) {
        shader = document.getElementById("shader");
    }
    if (!update_notice_panel) {
        update_notice_panel = document.getElementById("update_notice_panel");
    }
    if (!update_notice_button) {
        update_notice_button = document.getElementById("update_notice_button");
    }

    onclick_shader();
    show_element(update_notice_panel);
    show_element(shader);

    if (update_notice_button) {
        update_notice_button.classList.remove("has-unread");
    }
    if (update_notice_hash !== "") {
        try {
            localStorage.setItem("arcane_update_notice_read", update_notice_hash);
        } catch (err) {
            console.warn("Unable to store update notice read state:", err);
        }
    }
}

function close_update_notice() {
    if (!shader) {
        shader = document.getElementById("shader");
    }
    hide_element(shader);
    hide_element(update_notice_panel);
}

// tag cards to create different border colors
function get_class_name_by_card_info(card_info) {
    switch (card_info.category) {
        case "?":
            return "ele_none";
        case "无":
        case "奥术":
        case "人物":
            return "ele_none";
        case "火焰":
        case "火":
            return "ele_fire";
        case "水纹":
        case "水":
            return "ele_water";
        case "大气":
        case "气":
            return "ele_air";
        case "地脉":
        case "地":
            return "ele_earth";
        case "光辉":
        case "光":
            return "ele_light";
        case "暗影":
        case "暗":
            return "ele_dark";
        default:
            return "ele_unknown";
    }
}

function is_legend(card_info) {
    if (card_info.tag.includes("传奇") || card_info.tag.includes("传说")) {
        return true;
    }
    return false;
}

function get_information_bar_by_card_info(card_info) {
    const information_div = document.createElement("div");
    information_div.className = "card_information_bar";
    category = card_info.category;
    category = category.replaceAll("?", "无");
    for (const placeholder in element_placeholders) {
        category = category.replaceAll(
            placeholder,
            `<img src="${element_placeholders[placeholder]}" class="card_information_bar_inline_image inline_image">`
        );
    }

    information_div.innerHTML =
        card_info.type + " " + category + " " + card_info.tag;
    if (is_legend(card_info)) {
        information_div.innerHTML += " ✡";
    }
    return information_div;
}

function get_discription_element_by_card_info(card_info) {
    if (card_info.description == "") {
        return null;
    }
    const description_div = document.createElement("div");
    description_div.className = "card_description";
    description = card_info.description;
    description_div.innerHTML = description;
    return description_div;
}

function hide_element(element) {
    if (!element) {
        return element;
    }
    element.setAttribute("hidden", "true");
    if (!element.classList.contains("hidden")) {
        element.classList.add("hidden");
    }
    return element;

    // add hidden to class name
}
function show_element(element) {
    if (!element) {
        return element;
    }
    if (element.hasAttribute("hidden")) {
        element.removeAttribute("hidden");
    }
    // return element;
    // remove hidden from class name
    if (element.classList.contains("hidden")) {
        element.classList.remove("hidden");
    }
    return element;
}

function get_dummy_img_src(card_info) {
    return "resources/dummy.jpg";
}

function get_image_src(card_info) {
    return card_image_base_url + card_info.output_path;
}

function normalize_card_info(card_info) {
    if (!card_info || !card_info.set_code) {
        return card_info;
    }
    const normalized = Object.assign({}, card_info);
    normalized.tag = [card_info.rarity, card_info.subtype]
        .filter(Boolean)
        .join(" ");
    normalized.version = card_info.set_name || "";
    normalized.version_name = card_info.set_name || "";
    normalized.elements_cost =
        card_info.load_occupancy || card_info.tech_requirement || {};
    normalized.elements_gain =
        card_info.load_capacity || card_info.elements_gain || {};
    normalized.elements_expense = {};
    if (card_info.activation_mana !== undefined && card_info.activation_mana !== null) {
        normalized.elements_expense[card_info.category || "法力"] =
            card_info.activation_mana;
    }
    normalized.attack = card_info.attack ?? -1;
    normalized.life = card_info.life ?? -1;
    normalized.power = -1;
    normalized.duration = -1;
    normalized.spawns = normalize_spawn_numbers(card_info.spawns);
    return normalized;
}

function normalize_spawn_numbers(spawns) {
    if (!Array.isArray(spawns)) {
        return [];
    }
    return spawns
        .map(function (number) {
            return String(number).trim();
        })
        .filter(function (number) {
            return number !== "";
        });
}

function hydrate_new_schema_spawns(new_cards, legacy_cards) {
    if (!Array.isArray(new_cards) || !Array.isArray(legacy_cards)) {
        return;
    }
    const legacy_by_number = {};
    for (let i = 0; i < legacy_cards.length; i++) {
        legacy_by_number[String(legacy_cards[i].number)] = legacy_cards[i];
    }
    const new_by_legacy_number = {};
    for (let i = 0; i < new_cards.length; i++) {
        const art_ref = new_cards[i].art_ref;
        if (art_ref !== null && art_ref !== undefined && art_ref !== "") {
            new_by_legacy_number[String(art_ref)] = new_cards[i];
        }
    }
    for (let i = 0; i < new_cards.length; i++) {
        const card_info = new_cards[i];
        const spawn_numbers = new Set(normalize_spawn_numbers(card_info.spawns));
        const legacy_card = legacy_by_number[String(card_info.art_ref || "")];
        const legacy_spawns = legacy_card
            ? normalize_spawn_numbers(legacy_card.spawns)
            : [];
        for (let j = 0; j < legacy_spawns.length; j++) {
            const spawn_info = new_by_legacy_number[legacy_spawns[j]];
            if (spawn_info && spawn_info.rarity === "衍生") {
                spawn_numbers.add(String(spawn_info.number));
            }
        }
        card_info.spawns = Array.from(spawn_numbers);
    }
}

function get_img_element_by_card_info(card_info) {
    const img_element = document.createElement("img");
    img_element.className = "card_img";
    // img_element.src = get_dummy_img_src(card_info);
    img_element.src = get_image_src(card_info);
    img_element.setAttribute("card_number", card_info.number);
    return img_element;
}

function get_zoom_elements_str(card_category, card_elements) {
    let eles = [];
    let nums = [];
    eles.push(card_category);
    nums.push(0);
    for (let i = 0; i < Object.keys(card_elements).length; i++) {
        if (Object.keys(card_elements)[i] == card_category) {
            nums[0] = card_elements[card_category];
        } else {
            eles.push(Object.keys(card_elements)[i]);
            nums.push(card_elements[Object.keys(card_elements)[i]]);
        }
    }
    let rt_str = "";
    for (let i = 0; i < eles.length; i++) {
        if (nums[i] > 0) {
            rt_str += nums[i] + " " + eles[i] + " ";
        }
    }
    // replace place holders with inline images
    rt_str = rt_str.replaceAll("?", "无");
    for (const placeholder in element_placeholders) {
        rt_str = rt_str.replaceAll(
            placeholder,
            `<img src="${element_placeholders[placeholder]}" class="zoom_text_inline_image inline_image">`
        );
    }
    return rt_str;
}

function set_zoom_text(card_info) {
    if (card_info.set_code) {
        set_new_schema_zoom_text(card_info);
        return;
    }
    let html_template = ``;
    let zoom_number_str = card_info.number.toString();
    let zoom_type_str = card_info.type;
    let zoom_name_str = card_info.name;
    let zoom_category_str = card_info.category;
    let zoom_tag_str = card_info.tag;
    html_template += `<li><strong>${zoom_name_str}</strong></li>`;

    // replace ? with 无 to in category str
    zoom_category_str = zoom_category_str.replaceAll("?", "无");
    // use inline images for elements
    for (const placeholder in element_placeholders) {
        zoom_category_str = zoom_category_str.replaceAll(
            placeholder,
            `<img src="${element_placeholders[placeholder]}" class="zoom_text_inline_image inline_image">`
        );
    }

    html_template += `<li>${zoom_number_str} ${zoom_type_str} ${zoom_category_str} ${zoom_tag_str}</li>`;

    let zoom_cost_str = get_zoom_elements_str(
        card_info.category,
        card_info.elements_cost
    );
    html_template += `<li><strong>入场花费:</strong> ${zoom_cost_str}</li>`;
    let zoom_expense_str = get_zoom_elements_str(
        card_info.category,
        card_info.elements_expense
    );
    if (zoom_expense_str != "") {
        html_template += `<li><strong>使用花费:</strong> ${zoom_expense_str}</li>`;
    }
    let zoom_gain_str = get_zoom_elements_str(
        card_info.category,
        card_info.elements_gain
    );
    if (zoom_gain_str != "") {
        html_template += `<li><strong>负载:</strong> ${zoom_gain_str}</li>`;
    }

    if (card_info.life > 0) {
        html_template += `<li><strong>生命:</strong> ${card_info.life.toString()}</li>`;
    }
    if (card_info.attack > 0) {
        html_template += `<li><strong>攻击:</strong> ${card_info.attack.toString()}</li>`;
    }
    if (card_info.power > 0) {
        html_template += `<li><strong>威力:</strong> ${card_info.power.toString()}</li>`;
    }
    if (card_info.duration > 0) {
        html_template += `<li><strong>持续:</strong> ${card_info.duration.toString()}</li>`;
    }
    if (card_info.description != "") {
        // replace place holders with inline images
        description = card_info.description;

        for (const placeholder in description_placeholders) {
            description = description.replaceAll(
                placeholder,
                `<img src="${description_placeholders[placeholder]}" class="zoom_text_inline_image inline_image">`
            );
        }

        html_template += `<li><strong>效果:</strong> ${description}</li>`;
    }
    if (card_info.spawns.length > 0) {
        html_template += `<li><strong>衍生:</strong> ${card_info.spawns.join(
            " "
        )}</li>`;
    }
    if (card_info.version_name != "") {
        html_template += `<li><strong>版本:</strong> ${card_info.version_name}</li>`;
    }

    if (card_info.quote != "") {
        html_template += `<li><i> ${card_info.quote}</i></li>`;
    }
    html_template = "<ul>" + html_template + "</ul>";
    zoom_text.innerHTML = html_template;
}

function set_new_schema_zoom_text(card_info) {
    let html_template = "";
    const typeLine = [
        card_info.number,
        card_info.type,
        card_info.category,
        card_info.rarity,
    ]
        .filter(Boolean)
        .join(" · ");
    html_template += `<li><strong>${card_info.name}</strong></li>`;
    html_template += `<li>${typeLine}</li>`;
    if (card_info.mana_cost !== null && card_info.mana_cost !== undefined) {
        html_template += `<li><strong>法力:</strong> ${card_info.mana_cost}</li>`;
    }
    if (card_info.activation_mana !== null && card_info.activation_mana !== undefined) {
        html_template += `<li><strong>使用法力:</strong> ${card_info.activation_mana}</li>`;
    }
    const load_occupancy =
        card_info.load_occupancy || card_info.tech_requirement || {};
    const load_capacity =
        card_info.load_capacity || card_info.elements_gain || {};
    if (Object.keys(load_occupancy).length > 0) {
        html_template += `<li><strong>负载占用:</strong> ${get_zoom_elements_str(card_info.category, load_occupancy)}</li>`;
    }
    if (Object.keys(load_capacity).length > 0) {
        html_template += `<li><strong>负载容量:</strong> ${get_zoom_elements_str(card_info.category, load_capacity)}</li>`;
    }
    [
        ["攻击", card_info.attack],
        ["生命", card_info.life],
        ["冷却", card_info.cooldown],
        ["技能槽", card_info.skill_slots],
    ].forEach(function (entry) {
        if (entry[1] !== null && entry[1] !== undefined) {
            html_template += `<li><strong>${entry[0]}:</strong> ${entry[1]}</li>`;
        }
    });
    if (card_info.description) {
        html_template += `<li><strong>效果:</strong> ${card_info.description}</li>`;
    }
    if (card_info.spawns.length > 0) {
        const spawn_names = card_info.spawns.map(function (number) {
            const spawn_info = get_card_info_by_number(number);
            return spawn_info ? spawn_info.name : number;
        });
        html_template += `<li><strong>衍生:</strong> ${spawn_names.join("、")}</li>`;
    }
    if (card_info.source) {
        html_template += `<li><strong>来源:</strong> ${card_info.source}</li>`;
    }
    if (card_info.quote) {
        html_template += `<li><i>${card_info.quote}</i></li>`;
    }
    zoom_text.innerHTML = `<ul>${html_template}</ul>`;
}

function onclick_element_show_detail(event) {
    // this would require element to have card_number attribute
    // clear shader's children
    show_element(shader);
    shader.innerHTML = "";
    let card_info = get_card_info_by_number(
        get_card_number_from_element(event.target)
    );
    let card_src = get_image_src(card_info);
    zoom_img.src = card_src;
    set_zoom_text(card_info);
    show_element(zoom_info);
    show_element(zoom_img);
    show_element(zoom_text);
}

function onclick_shader(event) {
    hide_element(shader);
    hide_element(zoom_img);
    hide_element(zoom_info);
    hide_element(zoom_text);
    hide_element(popup_img);
    hide_element(popup_hint);
    hide_element(update_notice_panel);
    hide_element(prebuilt_decks_panel);
    hide_element(local_decks_panel);
}

function find_deck_for_card(card_info) {
    if (card_info.set_code) {
        if (card_info.type === "人物") {
            return "hero";
        }
        return card_info.rarity === "衍生" ? "extra" : "main";
    }
    // 衍生物第三位为0
    if (card_info.number[0] == 4) {
        return "hero";
    } else if (card_info.number[2] == 0) {
        return "extra";
    } else if (card_info.type == "技能") {
        return "ability";
    } else if (card_info.type == "伙伴" || card_info.type == "道具") {
        return "main";
    } else {
        return "extra";
    }
}

function get_card_info_by_number(card_number) {
    for (let i = 0; i < all_card_infos.length; i++) {
        if (all_card_infos[i].number == card_number) {
            return all_card_infos[i];
        }
    }
}

function onclick_add_button(event) {
    const idx = event.target.getAttribute("idx");
    const card_info = displaying_card_infos[idx];
    const deck = find_deck_for_card(card_info);
    current_deck[deck].push(card_info);
    sort_cards_by_number(current_deck[deck]);
    add_spawn_cards(card_info);
    show_decks();
    // block onclick event being passed to parent elements
    event.stopPropagation();
}

function add_spawn_cards(card_info) {
    const spawns = card_info.hasOwnProperty("spawns") ? card_info.spawns : [];
    for (let i = 0; i < spawns.length; i++) {
        const spawn_number = String(spawns[i]);
        const spawn_info = get_card_info_by_number(spawn_number);
        if (!spawn_info) {
            console.warn("Unknown spawned card:", spawn_number, card_info.number);
            continue;
        }
        const spawn_deck = find_deck_for_card(spawn_info);
        let card_already_in_extra_deck = false;
        for (let j = 0; j < current_deck[spawn_deck].length; j++) {
            if (current_deck[spawn_deck][j].number == spawn_number) {
                card_already_in_extra_deck = true;
                break;
            }
        }
        if (card_already_in_extra_deck) {
            continue;
        }
        current_deck[spawn_deck].push(spawn_info);
        sort_cards_by_number(current_deck[spawn_deck]);
    }
}

function get_header_element_by_card_info(card_info, idx) {
    let header_div = document.createElement("div");
    header_div.className = "card_header";

    let name_div = document.createElement("div");
    name_div.className = "card_name";
    name_div.innerHTML = "<strong>" + card_info.name + "</strong>";

    let add_button = document.createElement("button");
    add_button.className = "card_add_button";
    add_button.innerHTML = "+";
    add_button.setAttribute("card_number", card_info.number);
    add_button.setAttribute("idx", idx);
    add_button.onclick = onclick_add_button;

    header_div.appendChild(name_div);
    header_div.appendChild(add_button);
    return header_div;
}

function get_card_number_from_element(card_element) {
    // if element is body, return null
    if (card_element.tagName == "BODY") {
        return null;
    }
    // if element has card_number attribute, return it
    if (card_element.getAttribute("card_number")) {
        return card_element.getAttribute("card_number");
    }
    // if not, check its parent
    return get_card_number_from_element(card_element.parentElement);
}

function get_card_element_by_card_info(card_info, idx) {
    const card_div = document.createElement("li");
    card_div.className = "card" + " " + get_class_name_by_card_info(card_info);
    const header_div = get_header_element_by_card_info(card_info, idx);
    card_div.appendChild(header_div);

    card_div.style.width = card_width;
    card_div.style.height = card_height;
    // 卡牌图片
    const img_element = get_img_element_by_card_info(card_info);

    // 类别 + 标签 + 属性 + 稀有度
    const information_bar_element = get_information_bar_by_card_info(card_info);

    // 卡牌描述
    const description_element = get_discription_element_by_card_info(card_info);

    if (information_bar_element) {
        card_div.appendChild(information_bar_element);
    }

    if (description_element && !img_element) {
        card_div.appendChild(description_element);
    }

    if (img_element) {
        card_div.appendChild(img_element);
    }
    card_div.setAttribute("card_number", card_info.number);
    card_div.onclick = onclick_element_show_detail;
    return card_div;
}

function button_filter_clicked() {
    console.log("button_filter_clicked");
    filter_all();
    save_filter_to_history(document.getElementById("input_filter").value);
    hide_filter_history();
    // clear the list
    document.getElementById("collections_list").innerHTML = "";
    // show all cards
    show_cards();
}

function onclick_zoomin() {
    const current_width = parseInt(card_width.slice(0, -2));
    const current_height = parseInt(card_height.slice(0, -2));
    card_width = Math.ceil(current_width * zoom_ratio).toString() + "px";
    card_height = Math.ceil(current_height * zoom_ratio).toString() + "px";
    var all_cards = document.getElementsByClassName("card");
    for (let i = 0; i < all_cards.length; i++) {
        all_cards[i].style.width = card_width;
        all_cards[i].style.height = card_height;
    }
    sync_card_grid_layout();
}

function onclick_zoomout() {
    const current_width = parseInt(card_width.slice(0, -2));
    const current_height = parseInt(card_height.slice(0, -2));
    card_width = Math.floor(current_width / zoom_ratio).toString() + "px";
    card_height = Math.floor(current_height / zoom_ratio).toString() + "px";
    var all_cards = document.getElementsByClassName("card");
    for (let i = 0; i < all_cards.length; i++) {
        all_cards[i].style.width = card_width;
        all_cards[i].style.height = card_height;
    }
    sync_card_grid_layout();
}

function onclick_hint() {
    onclick_shader();
    // show_element(popup);
    show_element(popup_hint);
    show_element(shader);
}

function get_deck_curve(card_infos) {
    let curve_dict = {};
    for (let i = curve_min; i <= curve_max; i++) {
        curve_dict[i] = 0;
    }
    for (let i = 0; i < card_infos.length; i++) {
        let card_info = card_infos[i];
        let card_cost = get_card_total_cost(card_info);
        if (card_cost > curve_max) {
            card_cost = curve_max;
        }
        curve_dict[card_cost] += 1;
    }
    return curve_dict;
}

function get_deck_component(card_infos) {
    let component_dict = { 伙伴: 0, 道具: 0, 装备: 0, 消耗品: 0, 地形: 0 };
    for (let i = 0; i < card_infos.length; i++) {
        let card_info = card_infos[i];
        if (card_info.type === "伙伴") {
            component_dict["伙伴"] += 1;
        } else {
            component_dict["道具"] += 1;
        }
        if (
            card_info.tag.includes("卷轴") ||
            card_info.tag.includes("药剂") ||
            card_info.tag.includes("符文")
        ) {
            component_dict["消耗品"] += 1;
        }
        if (
            card_info.tag.includes("武器") ||
            card_info.tag.includes("饰物") ||
            card_info.tag.includes("神器") ||
            card_info.tag.includes("防具") ||
            card_info.tag.includes("用具")
        ) {
            component_dict["装备"] += 1;
        }
        if (card_info.tag.includes("地形")) {
            component_dict["地形"] += 1;
        }
    }
    return component_dict;
}

function show_deck_info() {
    let main_curve = get_deck_curve(current_deck["main"]);
    main_labels = [];
    for (let i = curve_min; i < curve_max; i++) {
        main_labels.push(i.toString());
    }
    main_labels.push(curve_max.toString() + "+");
    let main_data = [];
    for (let i = curve_min; i <= curve_max; i++) {
        main_data.push(main_curve[i]);
    }
    main_deck_curve_chart_reference = draw_bar_plot(
        document.getElementById("main_deck_curve_canvas"),
        main_data,
        main_labels,
        main_deck_curve_chart_reference,
        "MAIN"
    );

    let ability_curve = get_deck_curve(current_deck["ability"]);
    let ability_labels = [];
    for (let i = curve_min; i < curve_max; i++) {
        ability_labels.push(i.toString());
    }
    ability_labels.push(curve_max.toString() + "+");
    let ability_data = [];
    for (let i = curve_min; i <= curve_max; i++) {
        ability_data.push(ability_curve[i]);
    }
    ability_deck_curve_chart_reference = draw_bar_plot(
        document.getElementById("ability_deck_curve_canvas"),
        ability_data,
        ability_labels,
        ability_deck_curve_chart_reference,
        "ABILITY"
    );

    let main_component = get_deck_component(current_deck["main"]);
    let main_component_labels = Object.keys(main_component);
    let main_component_data = Object.values(main_component);
    main_deck_components_chart_reference = draw_bar_plot(
        document.getElementById("main_deck_components_canvas"),
        main_component_data,
        main_component_labels,
        main_deck_components_chart_reference,
        ""
    );
}

function draw_bar_plot(canvas, data, labels, chart_reference, title = "") {
    // if the canvas has no chart
    if (chart_reference === null) {
        let ctx = canvas.getContext("2d");
        chart_reference = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        data: data,
                        backgroundColor: "rgba(216, 177, 93, 0.72)",
                        borderColor: "rgba(246, 239, 228, 0.5)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                color: "rgba(246, 239, 228, 0.74)",
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            color: "rgba(246, 239, 228, 0.08)",
                        },
                        ticks: {
                            color: "rgba(246, 239, 228, 0.68)",
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(246, 239, 228, 0.08)",
                        },
                        ticks: {
                            color: "rgba(246, 239, 228, 0.68)",
                            stepSize: 1, // Set the step size to 1 to ensure only integers are shown
                            callback: function (value) {
                                if (Number.isInteger(value)) {
                                    return value; // Only return the tick if it is an integer
                                }
                            },
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true, // Show the title
                        text: title, // Set the title text
                        color: "rgba(246, 239, 228, 0.86)",
                    },
                },
            },
        });
    } else {
        // update the chart
        chart_reference.data.datasets[0].data = data;
        chart_reference.labels = labels;
        chart_reference.update();
    }
    return chart_reference;
}

function toggle_deck_info_onclick() {
    // if hidden
    if (deck_info.classList.contains("hidden")) {
        show_element(deck_info);
    } else {
        hide_element(deck_info);
    }
}

function onclick_refresh() {
    url =
        window.location.origin +
        "/ArcaneComposer/?code=" +
        get_current_deck_code() +
        "&filter=" +
        document.getElementById("input_filter").value;
    window.location.assign(url);
}
