//Our main js code called by Jquery on doc ready
$(document).ready(function () {
    // custom OK and Cancel label
    // default: OK, Cancel
    alertify.set({ labels: {
        ok: "Ok, I got it."
    } });
    // button labels will be "Accept" and "Deny"
    alertify.alert("<div class='alertnotification'>Welcome!<br/>The following commands are valid:<br/><ul><li>N (North)</li><li>S (South)</li><li>E (East)</li><li>W (West)</li><li>P (Pick up)</li><li>A (About)</li></ul></div>");

    //game variables    
    var message,                // screen message to display
    hits = 10,                  // hit points for the player
    lightLevel = 100,           // current light level
    currentRoom = 0,            // initial room  
    exitRoom = 31,              // final room of the dungeon
    isGameOver = false;         // Maintain the state of the game
    isOgreAlive = true,         // Stores the state of the Ogre - Alive/Dead
    isDragonAlive = true,       // this is the gameover state
    lastDirection = "";         // Last direction taken.

    //All the rooms in the game
    var rooms = new Array("Dungeon Entrance", "Corridor of uncertainty", 'Ancient old cavern', "Great Cavern", "Underground River", "Stream", 'Dungeon Stream', "Dungeon Pool",
                          "Large Cavern", "Rough Tunnel", "Long Tunnel", "Dark Room", "Dark Room", "Cold Room", "Old Tunnel", "Cold Room",
                          "Old Cavern", "Short Corridor", "Short Corridor", "Grey Room", "Green Room", "Old Prison Cell", "Underground River",
                          "Large Cavern", "Rough Tunnel", "Long Tunnel", "Dark Room", "Dark Room", "Cold Room", "Old Tunnel", "Dragons Room");

    //Each exit relates to the index ie. Exits[0] SE which means rooms[0] the long path has two exits on the  South and East. If we look
    //down to the //Movement Code section you can see how we work out which rooms are connected to which
    var exits = new Array("E", "SWE", "WE", "SWE", "WE", "WE", "SWE", "WS",
                          "NSE", "SE", "WE", "NW", "SE", "W", "SNE", "NSW",
                          "NS", "NS", "SE", "WE", "NWE", "SWE", "WS", "N",
                          "N", "NWE", "NWE", "WE", "WE", "NW", "NE", "W");

    //All out game objects
    var gameObjects = new Array('', "Painting", "Knife", "Wand of Firebolts", "Goblet", "Wand of Wind", "Coins", "Helmet", "Candle", "Torch", "Iron Shield", "Armour", "Oil", "Axe", "Rope", "Boat", "Aerosol", "Candle", "Key");

    //Inventory array Contains all the things you can carry
    var inventory = new Array();
    inventory[0] = 2; //lets start our player off with a knife

    //location of game objects - these objects relate to a array index - so Object[1] the Painting is located
    //in rooms[2] the small garden - 999 indicates out of play 
    var objectLocations = [999, 1, 3, 4, 5, 6, 7, 8, 10, 11, 15, 14, 12, 18, 19, 16, 17, 9];

    //This function detects if the browser if a mobile - you'll see when we call this we apply the 
    function isMobile() {
        return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i)
                || navigator.userAgent.match(/Opera Mini/i) || navigator.userAgent.match(/IEMobile/i);
    }

    //The next line checks for a mobile browser and if it find st it will hide the buttons or hide the text box
    if (isMobile()) {
        //hide the text box - we dont need that for a mobile browser as its hard to use mobile keyboard for lots of commands
        $("#keyboard").hide();
    } else {
        //hide the buttons as we don't want that for the normal web experience
        $('#controllers').hide();

        //jquery command to force the textbox to take focus  
        $("#userInput").focus();
    }

    //javascript function to pickup the object in this room
    var pickup = function (roomIndex) {
        var itemIndex;
        if (objectLocations[roomIndex] > 0 && objectLocations[roomIndex] < 100) {
            // If there is an object here...
            itemIndex = getObjectForRoom(roomIndex);
            inventory[inventory.length] = itemIndex;
            objectLocations[roomIndex] = 999;
            alertify.success("You successfully picked up " + gameObjects[itemIndex]);
        } else {
            alertify.error("There are no items to pick up here");
        }
    }

    //This function  loops through the object location array and returns
    function getObjectForRoom(currentRoom) {
        var roomIndex = -1;
        for (var i = 0; i < objectLocations.length ; i++) {
            if (objectLocations[i] == currentRoom)
                roomIndex = i;
        }
        return roomIndex
    }

    // Returns the last direction if applicable
    function getLastDirection() {
        if (lastDirection == "") {
            return "You haven't moved yet, silly goose!";
        }
        else {
            return lastDirection;
        }
    }

    //This is a method/function that shows the game screen. If we look in deatil at this function we can see that 
    //it uses another function displayText to show each line of the screen.
    function displayGameScreen() {

        //clear the output div
        $display.empty();

        //Display the screen output text - note this does not include the buttons
        displayText("You are now in the: " + rooms[currentRoom]);
        displayText("Possible Directions: " + showAdjacentRooms(exits[currentRoom]));
        displayText("Last direction taken: " + getLastDirection());
        displayText("");
        displayText('Current Area #: ' + currentRoom);
        displayText('Light Level: ' + lightLevel);
        displayText("HP: " + hits);

        if (getObjectForRoom(currentRoom) != -1) {
            var index = getObjectForRoom(currentRoom);
            displayText("You can see " + gameObjects[index]);
        }

        //If there is something in our inventory then display it
        if (inventory.length > 0) {
            displayText("You are carrying: ");
            for (var i = 0; i < inventory.length ; i++) {
                displayText("-" + gameObjects[inventory[i]]);
            }
        }

        if (message != null) {
            displayText("<br/>" + message);
        }

        //Game over code
        if (isDragonAlive) {
            $('#GameOverDiv').hide();
            $('#GameDiv').show();
        }
        else {
            $('#GameOverDiv').show();
            $('#GameDiv').hide();
        }
        message = "What?";
    }

    //Replaces the indexOf js function as i have found it doesn't always work for me!!!!!!!!
    function checkIndex(issFullArray, issToCheck) {
        for (i = 0; i < issFullArray.length; i++) {
            if (issFullArray[i] == issToCheck) {
                return true;
            }
        }
        return false;
    }

    //Uses the text for a room to build a string that shows which rooms are next to the current room
    function showAdjacentRooms(e) {
        var newExits = "";
        if (e != null) {
            for (i = 0; i < e.length; i++) {
                if (i === e.length - 1) {
                    newExits += e.substring(i, i + 1);
                } else if (i === e.length - 2) {
                    newExits += e.substring(i, i + 1) + " & ";
                } else {
                    newExits += e.substring(i, i + 1) + ", ";
                }
            }
        }
        return newExits;
    }

    //Simple js function to display a line of text
    function displayText(text) {
        $display.html($display.html().toString() + text + "<br>");
    }

    //Each round we call this function to do all the main game processing 
    function processGameRound(command) {

        //Remove any spaces from the command text
        trimCommand = $.trim(command);

        //Process command takes the players action
        processCommand(command);

        //NOw that we have taken the players logic we need to activate the main game room logic
        if (currentRoom == 10 && isOgreAlive) {
            //if you are fighting the ogre and you have the spells
            if (checkIndex(inventory, 3)) {
                message += "\<br\>YOU attack the ogre with magic spells and kill him!";
                isOgreAlive = false;
            }
            else {
                message += "\<br\>Ogre attacks you!";
                hits--;
            }
        }

        //If you are in the final room and the dragon is still alive
        if (currentRoom == 31 && isDragonAlive) {
            //if you are fighting the dragon and you have the oil, burning torch
            if (checkIndex(inventory, 5) && checkIndex(inventory, 9) && checkIndex(inventory, 12)) {
                message += "\<br\>You attack the dragon with oil, burning torch and the wand of Wind - It creates and kill him!";
                isDragonAlive = false; //End Game
                gameover = true;           
            }
            else {
                message += "\<br\>The dragon attacks you with firebreath and kills you!";
                hits = 0;
                gameover = true;
            }
        }

        if (currentRoom == 25) {
            //if you are fighting the gas room burning torch
            if (checkIndex(inventory, 10)) {
                message += "\<br\>The gas in the room is ignited by the torch - You become a human BBQ and die!";
                hits = 0;
                gameover = true;
            }
        }
        displayGameScreen();
    }

    function processCommand(command) {
        var direction = command;
        message = "OK";
        switch (command) {
            //Movement Code
            case "N":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom -= 8;
                    lastDirection = command;
                    alertify.success("Moved North")
                }
                else
                    alertify.error("Can't move there");
                break;
            case "S":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom += 8;
                    lastDirection = command;
                    alertify.success("Moved South")
                }
                else
                   alertify.error("Can't move there");
                break;
            case "E":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom++;
                    lastDirection = command;
                    alertify.success("Moved East")
                }
                else
                    alertify.error("Can't move there");
                break;
            case "W":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom--;
                    lastDirection = command;
                    alertify.success("Moved West")
                }
                else
                    alertify.error("Can't move there");
                break;
                //End of Movement Code
            case "P":
                pickup(currentRoom);
                break
            case "A":
                alertify.set({ labels: {
                    ok: "So?"
                } });
                alertify.alert("<div class='alertnotification'>About<br/>Game built for Bea.</div>");
                break
            default:
                alertify.set({ labels: {
                    ok: "I'm sorry!"
                } });
                alertify.alert("<div class='alertnotification'>Opps, only the following commands are valid:<br/><ul><li>N (North)</li><li>S (South)</li><li>E (East)</li><li>W (West)</li><li>P (Pick up)</li><li>A (About)</li></ul></div>");
                break
        }
    }
    //JQuery selector that handles the form submit - 
    $('#input form').submit(function (evt) {
        processGameRound($('#userInput').val());

        $('#userInput').val('');
        evt.preventDefault();
    });

    //sets the output div to the display variable
    $display = $('#output');

    // This is jQuery selector that picks up an event from the button - in this case we look at the value of the button ie. its text and use that 
    //to call the same function as we would call from the equivalent keyboard command
    $(".button").click(function (e) {
        switch (this.value) {
            case "N":
                processGameRound('N');
                break;
            case "S":
                processGameRound('S');
                break;
            case "E":
                processGameRound('E');
                break;
            case "W":
                processGameRound('W');
                break;
            case "F":
                processGameRound('F');
                break;
            case "P":
                pickup(currentRoom);
                break;
            case "A":
                processGameRound('A');
                break;
        }
    });

    displayGameScreen();
});