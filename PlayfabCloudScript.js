// Switchblade PlayFab cloud script


function GetCharacterCustData(playerId)
{
	var playerCharCustData = server.GetUserData(
	{
		PlayFabId: playerId,
		Keys: ["CharacterCustomisation"]
	});
	
	return playerCharCustData;
}




// test function
handlers.test = function(args)
{
	var message = "The test was a complete success " + currentPlayerId + "!";
	
	return { messageValue: message };
}


// Called by the server when a player connects to the game
// should return player's details 
function RegisterPlayer(args)
{
    var inventoryData = server.GetUserInventory({ PlayFabId: args.PlayerUID });
    var vehicles = [];
    
    // Get server title data
     var serverPlayerData = server.GetTitleData({ Keys: ["Vehicles"] });
	var trophyData={};
    if(serverPlayerData.Data)
    {
    	if(serverPlayerData.Data["Vehicles"])
    		vehicles = JSON.parse(serverPlayerData.Data["Vehicles"]);
		

    }
	var accountInfo = server.GetUserAccountInfo({PlayFabId : args.PlayerUID});
	var playername = "";
	if (accountInfo.UserInfo.TitleInfo.DisplayName)
	{
		playername = accountInfo.UserInfo.TitleInfo.DisplayName;
	}
	
    
    // Add vehicles & Supers out of the player's inventory
    var inventoryVehicles = [];
    var inventoryVehicleSkins = [];
   
    for(var itemIndex=0;itemIndex < inventoryData.Inventory.length;itemIndex++)
    {
    	var invItem = inventoryData.Inventory[itemIndex];
    	
    	if(invItem.ItemClass == "Vehicle")
    		inventoryVehicles.push(invItem.ItemId);
    	if(invItem.ItemClass == "VehicleSkin")
    		inventoryVehicleSkins.push(invItem.ItemId);
    }
	
    	var customData = {};
	var charCustDataNew = {};
	
	customData = GetCharacterCustData(args.PlayerUID);
  	if(customData.Data["CharacterCustomisation"])
	{
	    charCustDataNew = JSON.parse(customData.Data["CharacterCustomisation"].Value);
	}		
   
	var additionalPlayerData = server.GetUserData(
	{
		PlayFabId: args.PlayerUID,
		Keys: ["Trophy"]
	});	
	
	if('Trophy' in additionalPlayerData.Data)
	{
		trophyData = JSON.parse(additionalPlayerData.Data["Trophy"].Value);
	}
	else		
	{       
		trophyData = {
		  "trophy_mvp": 0,
		  "trophy_wins": 0,
		  "trophy_powercoresaves": 0,
		  "trophy_killstreaks": 0,
		  "trophy_shopitemsused": 0,
		  "trophy_totalkills": 0,
		  "trophy_mobsdestroyed": 0,
		  "trophy_turretdowns": 0,
		  "trophy_turretsdestroyed": 0,
		  "trophy_coredamage": 0,
		  "trophy_mobdoors": 0,
		  "trophy_vehiclewins": []
		}
				
		server.UpdateUserData(
                {
                "PlayFabId": args.PlayerUID ,
                "Data":{
                   Trophy:JSON.stringify(trophyData)
                }
               });
	}
	// Dont count pickinglobby registrations
	if(args.IsMatch==true)
	{
		server.UpdatePlayerStatistics(
		{
			PlayFabId: args.PlayerUID,
			Statistics: [ {StatisticName: "MatchesStarted", Value: 1}]
		});
		log.info("Match was true");
	}

	return {
		playerId : args.PlayerUID, 
		playerName : playername,
		playerNetId : args.PlayerNetID, 
		availableVehicles: vehicles,   
		ownedVehicles: inventoryVehicles,
		ownedVehicleSkins: inventoryVehicleSkins,		
		CharacterCustomisation: charCustDataNew,
		inventory: inventoryData,
        trophy: trophyData
   };
}
   



function EndCurrentSeason()
{
	var data = {};
	
	data = admin.IncrementPlayerStatisticVersion("Rank");
	server.SetTitleInternalData({Key:"TEST_CRONYY", Value:"Hello WorldYYYY"});
	return data;
}


handlers.endCurrentSeason = function(args)
{
	
	//var jsonArgs = JSON.parse(args);
	return EndCurrentSeason();
}


handlers.registerPlayer = function(args)
{
	var jsonArgs = JSON.parse(args);
	return RegisterPlayer(jsonArgs);
}

function RevokeTechChip(arg)
{
	for(i = 0; i< arg.itemId.length; i++)
	{
		var playerStats = server.ConsumeItem(
		{
			PlayFabId: arg.playerId,		
			ItemInstanceId: arg.itemId[i],
			ConsumeCount: 1
		});
	}	
	var message = "Items Revoked";
	return { messageValue: message };
}


handlers.RevokeTechChip = function(args)
{
	var jsonArgs = JSON.parse(args);
	return RevokeTechChip(jsonArgs);
}

function CheckForMaintenance(args)
{
    var titleInternalData = server.GetTitleInternalData({Keys:["Maintenance"]});
	var maintenance = false;
	
	
	if(titleInternalData.Data["Maintenance"])
	{
		maintenance = titleInternalData.Data["Maintenance"];
	}
	return {ServerInMaintenance:maintenance};
}
handlers.onCheckMaintenance = function()
{	
	return CheckForMaintenance();
}

//==============================================================================================================================
// Get Account information
//==============================================================================================================================
function GetUserAccountInfo(args)
{
    var searchPlayerId = currentPlayerId;
	
	// Check Compulsory Params
	if ( args.PlayerUID )
	{
		searchPlayerId = args.PlayerUID;
		// log.info("GetUserAccountInfo : SET : searchPlayerId : " + searchPlayerId);
	}
	
	// Get PlayerID
	log.info("GetUserAccountInfo : searchPlayerId : " + searchPlayerId);
    var playerInfoData = server.GetUserAccountInfo({ PlayFabId: searchPlayerId });
	var playerInfo;
	
	// Check we got other players Info
	if(playerInfoData && playerInfoData["UserInfo"])
	{
		log.info("GetUserAccountInfo : OtherPlayer : " + searchPlayerId);
		playerInfo = playerInfoData["UserInfo"];
		log.info("GetUserAccountInfo : searchPlayerId : " + JSON.stringify(playerInfo));
	}
	else
	{
		log.info("GetUserAccountInfo : MyPlayer : " + currentPlayerId);
		playerInfoData = server.GetUserAccountInfo({ PlayFabId: currentPlayerId });
		log.info("GetUserAccountInfo : myPlayer : " + JSON.stringify(playerInfo));
		playerInfo = playerInfoData["UserInfo"];
	}

	// Account Info Return
    var userAccountInfo =
	{
        UserInfo : playerInfo,
	};
	return userAccountInfo;
}
handlers.onGetUserAccountInfo = function(args)
{	
	var jsonArgs = JSON.parse(args);
	return GetUserAccountInfo(jsonArgs);
}
