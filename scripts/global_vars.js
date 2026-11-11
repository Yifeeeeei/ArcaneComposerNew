var all_card_infos;
var card_data_url =
    "https://raw.githubusercontent.com/Yifeeeeei/ArcaneImages/main/new_output/all_card_infos.json";
var legacy_card_data_url =
    "https://raw.githubusercontent.com/Yifeeeeei/ArcaneImages/main/output/all_card_infos.json";
var card_image_base_url = "https://raw.githubusercontent.com/Yifeeeeei/ArcaneImages/main/";
var is_new_card_schema = true;
var displaying_card_infos;
var input_filter = "";
var filter_history_limit = 12;
var filter_history_storage_key = "arcane_filter_history";
var card_pool_sort_mode = "number";
var shader;
var current_deck = { hero: [], main: [], ability: [], extra: [] };
var deck_hero;
var deck_main;
var deck_ability;
var deck_extra;
var card_number_to_idx = {};
var input_deck_code;
var button_build;
var prebuilt_decks = [];
var prebuilt_decks_loaded = false;
var prebuilt_decks_panel;
var prebuilt_decks_url = "https://yifeeeeei.github.io/ArcaneDecks/index.json";
var local_decks = [];
var local_decks_storage_key = "arcane_local_decks";
var local_decks_limit = 60;
var local_decks_panel;
var local_decks_list;
var local_deck_name_input;

var popup_hint;
var popup_img;
var card_width = "200px";
var card_height = "330px";
var zoom_ratio = 1.25;
var zoom_img;
var zoom_info;
var zoom_text;
var update_notice_button;
var update_notice_panel;
var update_notice_body;
var update_notice_hash = "";

var curve_min = 0;
var curve_max = 7;
var main_deck_curve_chart_reference = null;
var ability_deck_curve_chart_reference = null;
var main_deck_components_chart_reference = null;

var update_card_numbers = [];

var element_placeholders = {
    光: "resources/placeholders/ele_light.png",
    暗: "resources/placeholders/ele_dark.png",
    水: "resources/placeholders/ele_water.png",
    火: "resources/placeholders/ele_fire.png",
    地: "resources/placeholders/ele_earth.png",
    气: "resources/placeholders/ele_air.png",
    无: "resources/placeholders/ele_none.png",
    // "?": "resources/placeholders/ele_none.png",
};

var description_placeholders = {
    "\\光": "resources/placeholders/ele_light.png",
    "\\暗": "resources/placeholders/ele_dark.png",
    "\\水": "resources/placeholders/ele_water.png",
    "\\火": "resources/placeholders/ele_fire.png",
    "\\地": "resources/placeholders/ele_earth.png",
    "\\气": "resources/placeholders/ele_air.png",
    "\\无": "resources/placeholders/ele_none.png",
    // "\\?": "resources/placeholders/ele_none.png",
    "\\攻": "resources/placeholders/attack.png",
    "\\持": "resources/placeholders/duration.png",
    "\\血": "resources/placeholders/life.png",
    "\\威": "resources/placeholders/power.png",
};
