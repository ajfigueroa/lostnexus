$(document).ready(function () {
    alertify.set({ labels: {
        ok: "Ok, I got it."
    } });
    alertify.alert("<div class='alertnotification'>Not so long ago in the mysterious land of Toronto, Canada...<br/>" +
                    "A cellphone was lost...</br><br/>" +
                    "Search through each of the rooms for valuable items needed to destroy and retrieve the lost nexus " + 
                    "from the one known as the Shipper.<br/>It is rumoured that his weakness is an Exodia Deck and a Reality " +
                    "Cheque<br/><br/>The following commands are valid:<br/><ul><li>N (North)</li><li>S (South)</li>" + 
                    "<li>E (East)</li><li>W (West)</li><li>P (Pick up)</li><li>A (About)</li></ul></div>", function(e) {
                        if (e) {
                            // Set focus to the user input textbox
                            $("#userInput").focus();
                        }
                    });

    // Game variables    
    var hits = 10,              // Hit points for the player
    lightLevel = 100,           // Current light level (SO USELESS)
    currentRoom = 0,            // Initial room  
    exitRoom = 31,              // Final room of the dungeon
    isGameOver = false;         // Maintain the state of the game
    isNegaBeaAlive = true,      // Stores the state of the Ogre - Alive/Dead
    isShipperAlive = true,      // This is the gameover state
    lastDirection = "",         // Last direction taken.
    firstTime = true,           // First time the user is playing the game
    currentNumberOfMoves = 0;   // Move counter, whenever a direction is successful.

    // All the rooms in the game
    var rooms = new Array("Union Station", "Honest Eds", 'Rogers Center', "CN Tower", "Air Canada Center", "The Distillery District", 
                          'Snakes and Lattes', "Alex's House", "Dance Cave", "Sewers", "Hammark", "Zanzibar VIP Room", 
                          "Zanzibar VIP Room", "Curling Rink", "Taxi", "Curling Rink", "Markham", "Construction Zone", "Construction Zone", 
                          "Concrete Jungle", "Greenhouse", "The Annex", "Cat Cafe", "Dance Cave", "Sewers", "Area with good Wind reception (Rare)", 
                          "Zanzibar VIP Room", "Sneaky Dees", "Curling Rink", "Taxi", "Shippers Lair");

    // 4 rooms are not as they are special zones.
    var offLimitRooms = [0, 10, 25, 30];

    // 27 rooms are allowed to have items
    var roomsAllowedToHaveItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29];

    // Kind of useless but this isn't all my code so HEY.
    var exits = new Array("E", "SWE", "WE", "SWE", "WE", "WE", "SWE", "WS",
                          "NSE", "SE", "WE", "NW", "SE", "W", "SNE", "NSW",
                          "NS", "NS", "SE", "WE", "NWE", "SWE", "WS", "N",
                          "N", "NWE", "NWE", "WE", "WE", "NW", "NE", "W");

    // We therefore need 27 objects where some can repeat.
    // However, we're only going to allow 20 rooms to have items at a given time so only 20 are needed.
    var gameObjects = new Array("Chocolate Cake",
                                "Map of Toronto", 
                                "Swiss Army Knife", 
                                "Mint Bag", 
                                "Goblet of Fire (The Book)", 
                                "Exodia Deck", 
                                "Coins for TTC", 
                                "Helmet for Walking", 
                                "Ear Wax (Not yours)", 
                                "Plastic Cell Phone", 
                                "Poutine from PoutineVille", 
                                "Reality Cheque", 
                                "Avenue-Q on Blu-Ray", 
                                "Markham Street Cred", 
                                "The missing T in Torono", 
                                "Power of Self Respect", 
                                "Pestro Card", 
                                "Guardian Angel", 
                                "Power of Love", 
                                "Old embrassing home video");

    // Inventory array Contains all the things you can carry
    var inventory = new Array();
    inventory[0] = "Metro Pass"; //Let's start off Bea with a metro pass so they can safely venture Toronto

    // These represent room numbers where items can be found
    // Shuffle found on: http://css-tricks.com/snippets/javascript/shuffle-array/
    // We'll slice the array to 14 of these rooms only so that not every room has an item
    var shuffledRooms = roomsAllowedToHaveItems.sort(function() { return 0.5 - Math.random() });
    var itemLocationRoomNumbers = shuffledRooms.slice(0, 15); // Grab first 14 only

    // Check if item in a room number is valid
    function objectExistsInRoomNumber(roomIndex) {
        // First thing first, check if this room even has an item
        var objectInRoomIndex = getObjectForRoom(roomIndex);
        if (objectInRoomIndex == -1) {
            return false;
        }

        // Now, check in the item list that this number is not 999 (OUR EDGE case for items out of play).
        return itemLocationRoomNumbers[objectInRoomIndex] != 999;
    }

    // Pickup the object in this room
    var pickup = function(roomIndex) {
        if (objectExistsInRoomNumber(roomIndex)) {
            // If there is an object here...
            var itemIndex = getObjectForRoom(roomIndex);
            inventory[inventory.length] = gameObjects[itemIndex % gameObjects.length]
            itemLocationRoomNumbers[itemIndex] = 999;
            alertify.success("You successfully picked up " + gameObjects[itemIndex % gameObjects.length]);
        } else {
            alertify.error("There are no items to pick up here");
        }
    }

    // This function  loops through the object location array and returns the index of the object in the room
    function getObjectForRoom(currentRoom) {
        var objectInRoomIndex = -1;
        if (currentRoom == 0) {
            return objectInRoomIndex;
        }

        for (var i = 0; i < itemLocationRoomNumbers.length ; i++) {
            if (itemLocationRoomNumbers[i] == currentRoom) {
                objectInRoomIndex = i;
                break;
            }
        }
        return objectInRoomIndex
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

    // This is a method/function that shows the game screen. If we look in deatil at this function we can see that 
    function displayGameScreen() {

        // Clear progress div as we're going to update it
        $('#progressOutput').empty();

        // Display progress
        if (firstTime) {
            displayProgress("You start your journey off at " + rooms[currentRoom]);
            firstTime = false;
        } else {
            displayProgress("You have ventured into " + rooms[currentRoom]);
        }

        // Display whats in the room
        var objectIndex = getObjectForRoom(currentRoom);

        if (objectIndex != -1) {
            displayProgress("You can see a " + gameObjects[objectIndex % gameObjects.length] + ". Enter 'P' to pick it up!");
        } else {
            var additionalMessage;
            var baseMessage = "There is nothing of interest here";

            switch (rooms[currentRoom]) {
                case 'Shippers Lair':
                    baseMessage = "";
                    additionalMessage = "The Shipper is here, I hope you have what it takes to destroy it."; 
                    break;
                case 'Area with good Wind reception (Rare)':
                    baseMessage = "";
                    additionalMessage = "There are rumours one named the Big 4 lies here and is prone to attack.";
                    break;
                case 'Cat Cafe':
                    additionalMessage = ". AW CATS!";
                    break;
                case 'Alexs House':
                    additionalMessage = " assuming you're ignoring that cool guy named Alex.";
                    break;
                case 'Dance Cave':
                    additionalMessage = " but you can spare a few moments to dance, no?";
                    break;
                case 'Construction Zone':
                    additionalMessage = " minus some headaches and rubberneckers.";
                    break;
                case 'Hammark':
                    baseMessage = "";
                    additionalMessage = "NEGA-BEA's Lair! Your opposite, your negative. (so probably a bit cooler)";
                    break;
                case 'Markham':
                    additionalMessage = ". Enough said."
                    break;
                case 'Zanzibar VIP Room':
                    additionalMessage = ", well...";
                    break;
                case 'CN Tower':
                    additionalMessage = " except an increasing fear of heights.";
                    break;
                case 'Honest Eds':
                    additionalMessage = " besides some good deals.";
                    break;
                default:
                    additionalMessage = ".";
                    break;
            }

            displayProgress(baseMessage + additionalMessage);
        }


        displayProgress("<br/>You can move in one of the following directions: " + showAdjacentRooms(exits[currentRoom]));
        displayMoveCount();
        // Debug purposes.
        // console.log('Current Area #: ' + currentRoom);
        updateHP(hits);
        updateLightLevel(lightLevel);
        updateLastDirection(getLastDirection());

        // If there is something in our inventory then display it
        if (inventory.length > 0) {
            updateInventory();
        }

        // Game Over alert and reloading
        if (isGameOver) {
            alertify.set({ labels: {
                ok: "Fine."
            } });
            alertify.alert("<div class='alertnotification'>Game Over</div>", function(e) {
                if (e) {
                    // Reload the page
                    location.reload();
                }
            });
        }
    }

    // Returns human readable name for the current room index
    function currentRoomName(currentRoomIndex) {
        if (currentRoomIndex > rooms.length) {
            return "Nowhere"
        } else {
            return rooms[currentRoomIndex];
        }
    }

    // Check if inventory contains item
    function inventoryContainsItem(itemIndex) {
        for (var key in inventory) {
            if (inventory[key] == gameObjects[itemIndex % gameObjects.length]) {
                return true;
            }
        }

        return false;
    }

    // Random item getter
    function randomItemIndexFromGameObjects() {
        return Math.floor(Math.random() * 101) % gameObjects.length;
    }

    /*
        Display Methods
    */
    // Uses the text for a room to build a string that shows which rooms are next to the current room
    // I did not write this. - AF
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

    function incrementMoveCount() {
        currentNumberOfMoves++;
    }

    function getMoveCount() {
        return currentNumberOfMoves;
    }

    function displayMoveCount() {
        $('#currentMoveCount').html(currentNumberOfMoves);
    }

    function displayProgress(text) {
        $('#progressOutput').html($('#progressOutput').html() + text + "<br/>");
    }

    function updateHP(hpLevel) {
        $('#userHP').html(hpLevel);
    }

    function updateLightLevel(lightLevel) {
        $("#userLightLevel").html(lightLevel);
    }

    function updateLastDirection(lastDirection) {
        $("#userLastDirection").html(lastDirection);
    }

    function updateInventory() {
        // First clear previous version.
        $("#inventoryList").empty();

        var inventoryList = "";
        // Now iterate and add to this list
        inventory.forEach(function(inventoryItem) {
            inventoryList += "<li>" + inventoryItem + "</li>";
        });

        $("#inventoryList").html("<ul>" + inventoryList + "</ul>");
    }

    // Alertify Helpers
    function successfulMove(direction) {
        alertify.success("<span class='fui-check'></span>&nbsp;&nbsp;&nbsp;Moved " + direction);
    }

    function unsuccessfulMove(direction) {
        alertify.error("<span class='fui-cross'></span>&nbsp;&nbsp;&nbsp;Can't move in the " + direction + " direction.");
    }

    function lostHP(pointsLost, toMonster) {
        alertify.error("<span class='fui-heart'></span>&nbsp;&nbsp;&nbsp;You lost " + pointsLost + " HP to " + toMonster + ".");
    }

    function userHasDied() {
        alertify.error("<span class='fui-heart'></span>&nbsp;&nbsp;&nbsp;You died.");
    }

    function attackedMonster(monster) {
        alertify.success("<span class='fui-user'></span>&nbsp;&nbsp;&nbsp;You destroyed " + monster);
    }

    function simple_alertify(text, okButtonTitle) {
        alertify.set({ labels: {
            ok: okButtonTitle
        } });
        alertify.alert('<div class="alertnotification">' + text + "</div>");
    }

    // Each round we call this function to do all the main game processing 
    function processGameRound(command) {

        // Remove any spaces from the command text
        trimCommand = $.trim(command);

        // Process command takes the players action
        processCommand(command);

        // Meeting NegaBea (Negative Bea..opps, almost gave that away)
        if (currentRoomName(currentRoom) == "Hammark" && isNegaBeaAlive) {
            // You are fighting the NegaBea
            var powerOfLoveIndex = gameObjects.indexOf("Power of Love");
            var powerOfSelfRespectIndex = gameObjects.indexOf("Power of Self Respect");

            if (inventoryContainsItem(powerOfLoveIndex)) {
                simple_alertify("Nega-Bea appeared and attacked but YOU had the " + gameObjects[powerOfLoveIndex] + " so it's dead.", "Yay now dismiss.");
                isNegaBeaAlive = false;
                attackedMonster("Nega-Bea");
            } 
            else if (inventoryContainsItem(powerOfSelfRespectIndex)) 
            {
                simple_alertify("Nega-Bea appeared and attacked but YOU had the " + gameObjects[powerOfSelfRespectIndex] + " so it's dead.", "Yay now dismiss.");
                isNegaBeaAlive = false;
                attackedMonster("Nega-Bea");
            }
            else 
            {
                simple_alertify("Nega-Bea appeared and attacked your self-esteem.<br/>You got hurt.", "Dismiss because you feel bad.");
                lostHP(1, "Nega-Bea");
                hits--;

                if (hits <= 0) {
                    userHasDied();
                    isGameOver = true;
                }
            }
        }

        // Meeting the Shipper (Final Boss). Yes, Shipper as in Korrasami shippers.
        if (currentRoomName(currentRoom) == "Shippers Lair" && isShipperAlive) {
            // if you are fighting the shipper and you have the deadly combo needed.
            var exodiaItemIndex = gameObjects.indexOf("Exodia Deck");
            var realityItemIndex = gameObjects.indexOf("Reality Cheque");

            if (inventoryContainsItem(exodiaItemIndex) && inventoryContainsItem(realityItemIndex)) {
                simple_alertify("The Shipper appeared but you attacked it by using obliderate from the " + gameObjects[exodiaItemIndex] + 
                    " and cashing in the " + gameObjects[realityItemIndex] + "!<br/><br/>He will no longer suggest weird ships and you " + 
                    "got your cellphone back!<br/><br/>You finished in " + getMoveCount() + " moves.", "Congratulation!");
                isShipperAlive = false; //End Game
                isGameOver = true;           
            }
            else {
                simple_alertify("The Shipper appeared and attacked you with its uncomfortable fan fiction. Tough luck kid, you're dead.", "Dismiss");
                
                hits = 0;
                userHasDied();
                isGameOver = true;
            }
        }

        // Meeting the Big 4 because you have Wind...get it?
        if (currentRoomName(currentRoom) == "Area with good Wind reception (Rare)") {
            var randomIndex = randomItemIndexFromGameObjects();
            if (inventoryContainsItem(randomIndex)) {
                simple_alertify("You heard your phone ring and because you had " + gameObjects[randomIndex] + ". You were safe from a potential attack", "Dismiss");
            } 
            else {
                simple_alertify("You heard your cellphone ring but something attacked you in the dark before you could make sense of it!<br/>You got hurt physically and emotionally.", "Dismiss");
                hits = hits - 2;
                lostHP(2, "Big 4");
                if (hits <= 0) {
                    userHasDied();
                    isGameOver = true;
                }
            }
        }

        displayGameScreen();
    }

    function parseCommand(command) {
        // If the command is the full word, let's use it anyways.
        // There is probably a better way to do this BUT THIS IS ALL HACKY AND THE POINTS DON'T MATTER.
        var alternateCommand = command;

        switch (command) {
            case "NORTH":
                alternateCommand = 'N';
                break;
            case "SOUTH":
                alternateCommand = 'S';
                break;
            case "WEST":
                alternateCommand = 'W';
                break;
            case "EAST":
                alternateCommand = 'E';
                break;
            case "PICK UP":
                alternateCommand = 'P';
                break;
            case "PICK-UP":
                alternateCommand = 'P';
                break;
            case "ABOUT":
                alternateCommand = 'A';
                break;
            default:
                // Do nothing because the command fits none of these cases.
                break;
        }

        return alternateCommand;
    }

    function processCommand(command) {
        // Parse the command quick to make sure it's valid.
        command = parseCommand(command.toUpperCase());
        var direction = command;

        switch (command) {
            case "N":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom -= 8;
                    lastDirection = command;
                    incrementMoveCount();
                    successfulMove("North");
                }
                else {
                    unsuccessfulMove("North");
                }
                break;
            case "S":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom += 8;
                    lastDirection = command;
                    incrementMoveCount();
                    successfulMove("South")
                }
                else {
                   unsuccessfulMove("South");
                }
                break;
            case "E":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom++;
                    lastDirection = command;
                    incrementMoveCount();
                    successfulMove("East")
                }
                else {
                    unsuccessfulMove("East");
                }
                break;
            case "W":
                if (exits[currentRoom].indexOf(direction) > -1) {
                    currentRoom--;
                    lastDirection = command;
                    incrementMoveCount();
                    successfulMove("West")
                }
                else {
                    unsuccessfulMove("West");
                }
                break;
            case "P":
                pickup(currentRoom);
                break
            case "A":
                alertify.set({ labels: {
                    ok: "Dismiss"
                } });
                alertify.alert("<div class='alertnotification'><span style='text-decoration: underline;'>About</span><br/><br/>A Game built for Bea.</div>");
                break
            case "WHO IS BEA?":
                alertify.set({ labels: {
                    ok: "Dismiss"
                } });
                alertify.alert("<div class='alertnotification'>Ask her yourself.</div>");
                break;
            case "MEATBALLS":
                alertify.set({ labels: {
                    ok: "Dismiss"
                } });
                alertify.alert("<div class='alertnotification'>Stop that dipface :D</div>");
                break;
            default:
                alertify.set({ labels: {
                    ok: "I have learned the errors of my ways."
                } });
                alertify.alert("<div class='alertnotification'>Opps, only the following commands are valid:<br/><ul><li>N (North)</li><li>S (South)</li><li>E (East)</li><li>W (West)</li><li>P (Pick up)</li><li>A (About)</li></ul></div>");
                break
        }
    }

    // Form Submission
    $('#input form').submit(function (evt) {
        processGameRound($('#userInput').val());

        $('#userInput').val('');
        evt.preventDefault();
    });

    displayGameScreen();
});