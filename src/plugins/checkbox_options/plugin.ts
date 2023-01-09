/**
 * Plugin: "restore_on_backspace" (Tom Select)
 * Copyright (c) contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 */

import TomSelect from '../../tom-select';
import { preventDefault, hash_key } from '../../utils';
import { getDom } from '../../vanilla';


export default function(this:TomSelect) {
	var self = this;
	var orig_onOptionSelect = self.onOptionSelect;

	self.settings.hideSelected = false;


	// update the checkbox for an option
	var UpdateCheckbox = function(option:HTMLElement){
		setTimeout(()=>{
			var checkbox = option.querySelector('input');
			const selectedAriaMessage = self.settings.selectedAriaMessage || ''
			const notSelectedAriaMessage = self.settings.notSelectedAriaMessage || ''
			if( checkbox instanceof HTMLInputElement ){
				const dataAriaLabel = option.getAttribute('data-aria-label')
				if( option.classList.contains('selected') ){
					checkbox.checked = true;
					option.setAttribute('aria-label', `${dataAriaLabel}${selectedAriaMessage ? `, ${selectedAriaMessage},` : ''}`)
				}else{
					checkbox.checked = false;
					option.setAttribute('aria-label', `${dataAriaLabel}${notSelectedAriaMessage ? `, ${notSelectedAriaMessage},` : ''}`)
				}
			}
		},1);
	};

	// add checkbox to option template
	self.hook('after','setupTemplates',() => {

		var orig_render_option = self.settings.render.option;

		self.settings.render.option = (data, escape_html) => {
			var rendered = getDom(orig_render_option.call(self, data, escape_html));
			var checkbox = document.createElement('input');
			checkbox.addEventListener('click',function(evt){
				preventDefault(evt);
			});

			checkbox.type = 'checkbox';
			checkbox.setAttribute('tabindex', '-1')
			checkbox.setAttribute('aria-hidden', 'true')
			rendered.setAttribute('data-aria-label', rendered.innerText)
			const hashed = hash_key(data[self.settings.valueField]);
			const dataAriaLabel = rendered.getAttribute('data-aria-label')
			const selectedAriaMessage = self.settings.selectedAriaMessage || ''
			const notSelectedAriaMessage = self.settings.notSelectedAriaMessage || ''
			const checkboxIconHtml = self.settings.checkboxIconHtml || ''

			if( hashed && self.items.indexOf(hashed) > -1 ){
				checkbox.checked = true;
				rendered.setAttribute('aria-label', `${dataAriaLabel}${selectedAriaMessage ? `, ${selectedAriaMessage},` : ''}`)
			} else {
				rendered.setAttribute('aria-label', `${dataAriaLabel}${notSelectedAriaMessage ? `, ${notSelectedAriaMessage},` : ''}`)
			}

			rendered.prepend(checkbox);

			if (checkboxIconHtml) {
				checkbox.insertAdjacentHTML('afterend', checkboxIconHtml)
			}

			return rendered;
		};
	});

	// uncheck when item removed
	self.on('item_remove',(value:string) => {
		var option = self.getOption(value);

		if( option ){ // if dropdown hasn't been opened yet, the option won't exist
			option.classList.remove('selected'); // selected class won't be removed yet
			UpdateCheckbox(option);
		}
	});

	// check when item added
	self.on('item_add',(value:string) => {
		var option = self.getOption(value);

		if( option ){ // if dropdown hasn't been opened yet, the option won't exist
			UpdateCheckbox(option);
		}
	});


	// remove items when selected option is clicked
	self.hook('instead','onOptionSelect',( evt:KeyboardEvent, option:HTMLElement )=>{

		if( option.classList.contains('selected') ){
			option.classList.remove('selected')
			self.removeItem(option.dataset.value);
			self.refreshOptions();
			preventDefault(evt,true);
			return;
        }

		orig_onOptionSelect.call(self, evt, option);

		UpdateCheckbox(option);
	});

};
