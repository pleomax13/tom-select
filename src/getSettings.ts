import defaults from './defaults.js';
import { hash_key } from './utils';
import { TomSettings } from './types/settings';

export default function getSettings( input:HTMLInputElement, settings_user:TomSettings):TomSettings{
	var settings				= Object.assign({}, defaults, settings_user);

	var attr_data				= settings.dataAttr;
	var field_label				= settings.labelField;
	var field_value				= settings.valueField;
	var field_disabled			= settings.disabledField;
	var field_optgroup			= settings.optgroupField;
	var field_optgroup_label	= settings.optgroupLabelField;
	var field_optgroup_value	= settings.optgroupValueField;

	var tag_name				= input.tagName.toLowerCase();
	var placeholder				= input.getAttribute('placeholder') || input.getAttribute('data-placeholder');

	if (!placeholder && !settings.allowEmptyOption) {
		let option		= input.querySelector('option[value=""]');
		if( option ){
			placeholder = option.textContent;
		}

	}

	var settings_element		= {
										placeholder	: placeholder,
										options		: [],
										optgroups	: [],
										items		: [],
										maxItems	: null,
									};


	/**
	 * Initialize from a <select> element.
	 *
	 */
	var init_select = () => {
		var tagName;
		var options = settings_element.options;
		var optionsMap = {};
		var group_count = 1;

		var readData = (el) => {

			var data	= Object.assign({},el.dataset); // get plain object from DOMStringMap
			var json	= attr_data && data[attr_data];

			if( typeof json === 'string' && json.length ){
				data = Object.assign(data,JSON.parse(json));
			}

			return data;
		};

		var addOption = (option, group?:string) => {

			var value = hash_key(option.value);
			if (!value && !settings.allowEmptyOption) return;

			// if the option already exists, it's probably been
			// duplicated in another optgroup. in this case, push
			// the current group to the "optgroup" property on the
			// existing option so that it's rendered in both places.
			if (optionsMap.hasOwnProperty(value)) {
				if (group) {
					var arr = optionsMap[value][field_optgroup];
					if (!arr) {
						optionsMap[value][field_optgroup] = group;
					} else if (!Array.isArray(arr)) {
						optionsMap[value][field_optgroup] = [arr, group];
					} else {
						arr.push(group);
					}
				}
				return;
			}

			var option_data             = readData(option);
			option_data[field_label]    = option_data[field_label] || option.textContent;
			option_data[field_value]    = option_data[field_value] || value;
			option_data[field_disabled] = option_data[field_disabled] || option.disabled;
			option_data[field_optgroup] = option_data[field_optgroup] || group;

			optionsMap[value] = option_data;
			options.push(option_data);

			if( option.selected ){
				settings_element.items.push(value);
			}
		};

		var addGroup = ( optgroup ) => {
			var id, optgroup_data

			optgroup_data							= readData(optgroup);
			optgroup_data[field_optgroup_label]		= optgroup_data[field_optgroup_label] || optgroup.getAttribute('label') || '';
			optgroup_data[field_optgroup_value]		= optgroup_data[field_optgroup_value] || group_count++;
			optgroup_data[field_disabled]			= optgroup_data[field_disabled] || optgroup.disabled;
			settings_element.optgroups.push(optgroup_data);

			id = optgroup_data[field_optgroup_value];

			for( const option of optgroup.children ){
				addOption(option, id);
			}

		};

		settings_element.maxItems = input.hasAttribute('multiple') ? null : 1;

		for( const child of input.children ){
			tagName = child.tagName.toLowerCase();
			if (tagName === 'optgroup') {
				addGroup(child);
			} else if (tagName === 'option') {
				addOption(child);
			}
		}

	};


	/**
	 * Initialize from a <input type="text"> element.
	 *
	 */
	var init_textbox = () => {
		var values, option;

		var data_raw = input.getAttribute(attr_data);

		if (!data_raw) {
			var value = input.value.trim() || '';
			if (!settings.allowEmptyOption && !value.length) return;
			values = value.split(settings.delimiter);

			for( const value of values ){
				option = {};
				option[field_label] = value;
				option[field_value] = value;
				settings_element.options.push(option);
			}
			settings_element.items = values;
		} else {
			settings_element.options = JSON.parse(data_raw);
			for( const opt of settings_element.options ){
				settings_element.items.push(opt[field_value]);
			}
		}
	};


	if (tag_name === 'select') {
		init_select();
	} else {
		init_textbox();
	}

	return Object.assign( {}, defaults, settings_element, settings_user) as TomSettings;
};
