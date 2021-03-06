/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import {
	registerBlockType,
	setDefaultBlockName,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as paragraph from './paragraph';
import * as image from './image';
import * as heading from './heading';
import * as quote from './quote';
import * as gallery from './gallery';
import * as audio from './audio';
import * as button from './button';
import * as code from './code';
import * as columns from './columns';
import * as column from './columns/column';
import * as cover from './cover';
import * as embed from './embed';
import * as file from './file';
import * as html from './html';
import * as mediaText from './media-text';
import * as list from './list';
import * as missing from './missing';
import * as more from './more';
import * as nextpage from './nextpage';
import * as preformatted from './preformatted';
import * as pullquote from './pullquote';
import * as separator from './separator';
import * as spacer from './spacer';
import * as subhead from './subhead';
import * as table from './table';
import * as template from './template';
import * as textColumns from './text-columns';
import * as verse from './verse';
import * as video from './video';

import * as classic from './classic';

export const registerCoreBlocks = () => {
	[
		// Common blocks are grouped at the top to prioritize their display
		// in various contexts — like the inserter and auto-complete components.
		paragraph,
		image,
		heading,
		gallery,
		list,
		quote,

		// Register all remaining core blocks.
		audio,
		button,
		code,
		columns,
		column,
		cover,
		embed,
		...embed.common,
		...embed.others,
		file,
		window.wp && window.wp.oldEditor ? classic : null, // Only add the classic block in WP Context
		html,
		mediaText,
		missing,
		more,
		nextpage,
		preformatted,
		pullquote,
		separator,
		spacer,
		subhead,
		table,
		template,
		textColumns,
		verse,
		video,
	].forEach( ( block ) => {
		if ( ! block ) {
			return;
		}
		const { name, settings } = block;
		registerBlockType( name, settings );
	} );

	setDefaultBlockName( paragraph.name );
	if ( window.wp && window.wp.oldEditor ) {
		setFreeformContentHandlerName( classic.name );
	}
	setUnregisteredTypeHandlerName( missing.name );
};
