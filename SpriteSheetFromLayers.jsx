/* Needs animation to be in 1 layer per frame, convert frames to clip!*/



#target photoshop
var originalRulerUnits;

var animationDoc;
var spriteSheetDoc;


var numberOfFrames;
var frameHeight;
var frameWidth;

var gridResX;
var gridResY;

var frameLayers = [];

// settings
var framesBottomToTop = false ;     // frame order BottomToTop
var powerOfTwoResolution = false;   // ceil resolution to next power of 2
var framePadding = 0;               // padding between the frames
var sheetPadding = 0;               // padding between the sheet border and the frames

main();

function main()
{
    

    // Show dialog window for user options
    var window = new Window("dialog", "Sprite Sheet Generator");
    window.add("statictext", undefined, "This script creates a sprite sheet based on visible layers in the active document.").alignment = "left";;
    window.add("statictext", undefined, "If the animation is a timeline-animation, convert it to clip first.").alignment = "left";

    var checkBoxes = window.add("group", undefined);
    checkBoxes.alignment = "left";
    checkBoxes.orientation = "column";
    var framesBottomToTopCheck = checkBoxes.add("CheckBox", undefined, "Pick layers top to bottom");
    framesBottomToTopCheck.alignment = "left";
    var powerOfTwoResolutionCheck = checkBoxes.add("CheckBox", undefined, "Force power of two resolution");
    framesBottomToTopCheck.alignment = "left";
    
    var framePaddingInputGroup = window.add("group", undefined);
    framePaddingInputGroup.alignment = "left";
    framePaddingInputGroup.add("statictext", undefined, "Padding between the frames in pixels: " );
    var framePaddingInput = framePaddingInputGroup.add('edittext{text: 0, characters: 4, justify:"center"}');
    framePaddingInput.characters = 4;
    
    var sheetPaddingInputGroup = window.add("group", undefined);
    sheetPaddingInputGroup.alignment = "left";
    sheetPaddingInputGroup.add("statictext", undefined, "Padding between the sheet and the outer frames in pixels: " );
    var sheetPaddingInput = sheetPaddingInputGroup.add('edittext{text: 0, characters: 4, justify:"center"}');
    sheetPaddingInput.characters = 4;
        
    
    var buttons = window.add('group'); 
    var okButton = buttons.add('button', undefined, 'Ok');            // a button with the text "Ok" will close the window with return "1"
    var cancelButton = buttons.add('button', undefined, 'Cancel');     // a button with the text "Cancel" will close the window with return "2"
    
    var windowResult = window.show();
    
    // Check if window was not canceled (assume okay is pressed), else return
    if(windowResult == 2) return;
    
    // Apply Input from window to variables
    framesBottomToTop = framesBottomToTopCheck.value;
    powerOfTwoResolution = powerOfTwoResolutionCheck.value;
    framePadding = parseInt(framePaddingInput.text, 10);
    if(isNaN(framePadding) || framePadding < 0) framePadding = 0;
    sheetPadding = parseInt(sheetPaddingInput.text, 10);
    if(isNaN(sheetPadding) || sheetPadding < 0) sheetPadding = 0;
        
    
    
    // Set ruler units, cache the previous ones
    originalRulerUnits = preferences.rulerUnits;
    preferences.rulerUnits = Units.PIXELS;
    
    // Get Active Document as animationDoc, abort if there are no open documents
    if(GetAnimationDocument() == false)
    {
        alert("No document is opened. Please open the document with the animation frames as single layers.");
        return;
    }
    
    
    

    // Find sprite grid resolution closest to a square
    gridResX = Math.sqrt ((numberOfFrames * frameHeight) / frameWidth);
    gridResY = frameWidth * gridResX / frameHeight;

    // Round to int
    if(Math.abs((gridResX - Math.round (gridResX))) < Math.abs((gridResY - Math.round (gridResY))))
    {
        gridResX = Math.round(gridResX);
        gridResY = Math.ceil(numberOfFrames / gridResX);
    }
    else
    {
        gridResY = Math.round(gridResY);
        gridResX = Math.ceil(numberOfFrames / gridResY);
    }

    var spriteSheetResX = gridResX * frameWidth + (gridResX - 1) * framePadding + sheetPadding * 2;
    var spriteSheetResY = gridResY * frameHeight + (gridResY - 1) * framePadding + sheetPadding * 2;
    
    if(powerOfTwoResolution)
    {
    // Find nearest power of two for longest side, to set as the spriteSheetRes
    var nearestPowerOfTwo = Math.log(Math.max(spriteSheetResX, spriteSheetResY)) / Math.log(2);
    nearestPowerOfTwo = Math.ceil(nearestPowerOfTwo);
    nearestPowerOfTwo = Math.pow(2, nearestPowerOfTwo);
    spriteSheetResX = spriteSheetResY = nearestPowerOfTwo;
    
    // New grid res based on new spriteSheetRes
    gridResX = Math.floor((spriteSheetResX + framePadding - sheetPadding * 2) / (frameWidth + framePadding));
    gridResY = Math.ceil(numberOfFrames / gridResX );
    }

    
    // Create Name for Sprite Sheet Document
    var spriteSheetDocName = animationDoc.name.replace(".psd","");
    spriteSheetDocName += "_spriteSheet";
    spriteSheetDocName += "_cell" + parseInt(frameWidth) + "x" + parseInt(frameHeight);
    if(framePadding != 0)
        spriteSheetDocName += "_padding" + framePadding;
    if(sheetPadding != 0)
        spriteSheetDocName += "_border" + sheetPadding;
    // Create SpriteSheet Document
    spriteSheetDoc = documents.add(spriteSheetResX, spriteSheetResY, animationDoc.resolution, spriteSheetDocName);
                        
     
    
    // Loop through frame layers, copy them to spriteSheetDoc and position
    var currentGridX = 0;
    var currentGridY = 0;
    for(var i = 0; i < numberOfFrames; i++)
    {
        activeDocument = animationDoc;
        animationDoc.activeLayer = frameLayers[i];
        var newSpriteSheetLayer = frameLayers[i].duplicate(spriteSheetDoc);
        
        activeDocument = spriteSheetDoc;
        
        
        newSpriteSheetLayer.translate(currentGridX * (frameWidth + framePadding) + sheetPadding, currentGridY * (frameHeight + framePadding) + sheetPadding );
        
        currentGridX ++;
        
        if(currentGridX >= gridResX)
        {
            currentGridX = 0;
            currentGridY ++;
        }
    }
    
    // remove bottom white layer
    spriteSheetDoc.layers[spriteSheetDoc.layers.length -1].remove();

    // Reset ruler units to previous ones
    preferences.rulerUnits = originalRulerUnits;
    
    
}

function GetAnimationDocument()
{
    // Check if there are any opne documents
    if ( app.documents.length == 0 )
    {
        return false;
    }
    // Get Animation Document
    animationDoc = activeDocument;

    frameWidth = animationDoc.width;
    frameHeight = animationDoc.height;
        
    //frameLayers = animationDoc.layers;
    numberOfFrames = 0;
    // Fill in the frame layers array either normal or in reverse
    for(var i = 0; i < animationDoc.layers.length; i++)
    {
        var layer = undefined;
        if(framesBottomToTop == false)
        {
            layer = animationDoc.layers[i];
        }
        else
        {
            var index = animationDoc.layers.length -1 - i;
            layer = animationDoc.layers[index];
        }
        if(layer.visible)
        {
            numberOfFrames += 1;
            frameLayers[numberOfFrames -1] = layer;
        }
    }
  
}
