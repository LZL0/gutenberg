/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, renderToString } from '@wordpress/element';
import { Button, Path, SVG } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { DotTip } from '@wordpress/nux';
import { ifCondition, compose } from '@wordpress/compose';

function writeInterstitialMessage( targetDocument ) {
	let markup = renderToString(
		<div className="editor-post-preview-button__interstitial-message">
    		<p>{ __( 'Please wait' ) }</p>
			<p>{ __( 'Generating preview…' ) }</p>
		</div>
	);

	markup += `
		<style>
			body {
				margin: 0;
			}
			.editor-post-preview-button__interstitial-message {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100vh;
				width: 100vw;
			}
			p {
				text-align: center;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
			}
		</style>
	`;

	targetDocument.write( markup );
	targetDocument.close();
}

export class PostPreviewButton extends Component {
	constructor() {
		super( ...arguments );

		this.openPreviewWindow = this.openPreviewWindow.bind( this );
	}

	componentDidUpdate( prevProps ) {
		const { previewLink } = this.props;

		// This relies on the window being responsible to unset itself when
		// navigation occurs or a new preview window is opened, to avoid
		// unintentional forceful redirects.
		if ( previewLink && ! prevProps.previewLink ) {
			this.setPreviewWindowLink( previewLink );

			// Once popup redirect is evaluated, even if already closed, delete
			// reference to avoid later assignment of location in post update.
			delete this.previewWindow;
		}
	}

	/**
	 * Sets the preview window's location to the given URL, if a preview window
	 * exists and is not closed.
	 *
	 * @param {string} url URL to assign as preview window location.
	 */
	setPreviewWindowLink( url ) {
		const { previewWindow } = this;

		if ( previewWindow && ! previewWindow.closed ) {
			previewWindow.location = url;
		}
	}

	getWindowTarget() {
		const { postId } = this.props;
		return `wp-preview-${ postId }`;
	}

	openPreviewWindow( event ) {
		// Our Preview button has its 'href' and 'target' set correctly for a11y
		// purposes. Unfortunately, though, we can't rely on the default 'click'
		// handler since sometimes it incorrectly opens a new tab instead of reusing
		// the existing one.
		// https://github.com/WordPress/gutenberg/pull/8330
		event.preventDefault();

		// Open up a Preview tab if needed. This is where we'll show the preview.
		if ( ! this.previewWindow || this.previewWindow.closed ) {
			this.previewWindow = window.open( '', this.getWindowTarget() );
		}

		// Focus the Preview tab. This might not do anything, depending on the browser's
		// and user's preferences.
		// https://html.spec.whatwg.org/multipage/interaction.html#dom-window-focus
		this.previewWindow.focus();

		// If we don't need to autosave the post before previewing, then we simply
		// load the Preview URL in the Preview tab.
		if ( ! this.props.isAutosaveable ) {
			this.setPreviewWindowLink( event.target.href );
			return;
		}

		// Request an autosave. This happens asynchronously and causes the component
		// to update when finished.
		this.props.autosave();

		// Display a 'Generating preview' message in the Preview tab while we wait for the
		// autosave to finish.
		writeInterstitialMessage( this.previewWindow.document );
	}

	render() {
		const { previewLink, currentPostLink, isSaveable } = this.props;

		// Link to the `?preview=true` URL if we have it, since this lets us see
		// changes that were autosaved since the post was last published. Otherwise,
		// just link to the post's URL.
		const href = previewLink || currentPostLink;

		return (
			<Button
				isLarge
				className="editor-post-preview"
				href={ href }
				target={ this.getWindowTarget() }
				disabled={ ! isSaveable }
				onClick={ this.openPreviewWindow }
			>
				{ _x( 'Preview', 'imperative verb' ) }
				<span className="screen-reader-text">
					{
						/* translators: accessibility text */
						__( '(opens in a new tab)' )
					}
				</span>
				<DotTip tipId="core/editor.preview">
					{ __( 'Click “Preview” to load a preview of this page, so you can make sure you’re happy with your blocks.' ) }
				</DotTip>
			</Button>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getCurrentPostId,
			getCurrentPostAttribute,
			getAutosaveAttribute,
			getEditedPostAttribute,
			isEditedPostSaveable,
			isEditedPostAutosaveable,
		} = select( 'core/editor' );
		const {
			getPostType,
		} = select( 'core' );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		return {
			postId: getCurrentPostId(),
			currentPostLink: getCurrentPostAttribute( 'link' ),
			previewLink: getAutosaveAttribute( 'preview_link' ),
			isSaveable: isEditedPostSaveable(),
			isAutosaveable: isEditedPostAutosaveable(),
			isViewable: get( postType, [ 'viewable' ], false ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
	ifCondition( ( { isViewable } ) => isViewable ),
] )( PostPreviewButton );
