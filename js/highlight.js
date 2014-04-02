/**
 * This code produces highlights in PDF. Uses Rangy API: https://code.google.com/p/rangy/
 * TODO: tooltip or link for extra information
 *
 * @authors : A Q M Saiful Islam, Jaana Takis
 * @dependency : null
 */

var highlight  = {

    highlightRanges : null,
    /**
     * Serializes active window selection into Rangy format. TODO: add immediately to existing highlights
     *
     * @param void
     * @returns object {Page, Rangy} 
     */
    rangy_serialize: function () {
        var selection = rangy.getSelection();
        var s = this.stripRangeOfDomModifications(selection.getRangeAt(0));
        var ds = rangy.deserializePosition(s,  document.getElementById('viewer'));
        var page = this.currentPageNo(ds.node);
        return {
            Page:	page,
            Rangy:	s,
            Selection: selection
        }
    },

    /**
     *
     * @param problemNode
     * @param problemOffset
     * @returns {*}
     */
    originalPosition: function (problemNode, problemOffset) {
        var offset = 0;
        var parentDivNode = $(problemNode).closest('div')[0];  //parent div node of the problem node
        var parentDivRange = rangy.createRange();
        parentDivRange.selectNode(parentDivNode); //take node as range
        console.log("length="+parentDivRange.toString().length+": "+parentDivRange.toString());
        console.log(parentDivRange.toHtml());
        var preCaretRange = rangy.createRange();
        preCaretRange.selectNodeContents(parentDivNode);
        preCaretRange.setEnd(problemNode, problemOffset); //move end offset till the selection
        offset = preCaretRange.toString().length;
        var serialisedPos = rangy.serializePosition(parentDivNode.firstChild, offset, document.getElementById('viewer'));
        //alert(serialisedPos);
        return serialisedPos;
    },

    /**
     *
      * @param unstrippedRange
     * @returns {string}
     */
    stripRangeOfDomModifications: function (unstrippedRange) {
        var correctedStartPos = this.originalPosition(unstrippedRange.startContainer, unstrippedRange.startOffset);
        var correctedEndPos = this.originalPosition(unstrippedRange.endContainer, unstrippedRange.endOffset);
        var correctedPos = correctedStartPos+","+correctedEndPos;
        console.log("Selected range when stripped of DOM modifications: "+correctedPos);
        return correctedPos;
    },

    /**
     * Returns current page number with the help of rangy.
     *
     * @param element
     * @returns integer, the current page number that the given element belongs to
     */
    currentPageNo: function (element) {
        var classname, index;
        while (element = element.parentNode) {
            classname = element.className;
            if (classname == "page") {
                index = $(".page").index(element) + 1;
                break;
            }
        }
        return index;
    },

    /**
     * rangy related objects that need initialisation
     *
     * @return void
     */
    init: function() {
        rangy.init();
        cssApplier = rangy.createCssClassApplier("highlight", {normalize: true});
        highlight.highlightRanges = new Array();
    },

    /**
     * Deserializes strings into rangy ranges
     * Deserialise "&rangyFragment" parameter value in the URI
     *
     * @param array
     * @returns Range range array
     */
    deserializeArray: function (array) {
        var rangy_base = document.getElementById('viewer');
        for (i=0; i<array.length; i++) {
            if (array[i] != undefined) { //filter out URIs without &rangyFragment parameter value
                var r;
                if (rangy.canDeserializeRange(array[i], rangy_base)) { //BUG: potential rangy bug as it does not seem to catch deserialisation errors
                    r = rangy.deserializeRange(array[i], rangy_base);
                    console.log("	isvalid="+r.isValid());
                    highlight.highlightRanges.push(r);
                } else {
                    console.log("	"+array[i]+" is not serializable!");
                }
            }
        }
        return highlight.highlightRanges;
    },

    /**
     * Highlights given rangy positions with rangy. 
     * given rangy fragments (eg. ["0/3/3/1:0,0/3/3/1:9","0/1/3/1:17,0/1/3/1:21"]), apply highlights
     *
     * @param array
     * @returns void
     */
    rangy_highlight : function(rangyFragments) {
        //remove old highlights
        cssApplier.undoToRanges(highlight.highlightRanges);
        try {
            highlightRanges = highlight.deserializeArray(rangyFragments);
            cssApplier.applyToRanges(highlightRanges);
        } catch(err) {
            console.log("There was an error during highlighting. Potentially corrupted data. "+err.message);
        }
        console.log(highlight.highlightRanges.length+' highlights were applied! If some are missing there might be an overlap in which case they get discarded.');
    }
    
};
