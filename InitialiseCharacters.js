
// Initialises the player Characters
function InitialisePlayerCharacters(playerId)
{
	// Showing we are entering function
	log.info("InitialisePlayerCharacters -- Entering [ " + playerId + "  ] ");
	
	// Get Current Vehicle Created
	var vehicleCreatedKey = "MasteryVehicleCreated";
	var lastVehicleCreated = PlayerMasteryVehicles.length;
	var VehicleCreatedData = server.GetUserInternalData(
	{
		PlayFabId: playerId,
		Keys: ["MasteryVehicleCreated"]
	});

	// Check we have entry
	if (VehicleCreatedData.Data[vehicleCreatedKey])
	{
		// Extract last Created
		lastVehicleCreated = VehicleCreatedData.Data[vehicleCreatedKey].Value;
		log.info("MasteryVehicleCreated - READ = " + lastVehicleCreated);
	}
	else
	{
		// Create Entry and Reset
		lastVehicleCreated = 0;
		log.info("MasteryVehicleCreated - CREATE = " + lastVehicleCreated);
		var newInternalData = {};
		newInternalData[vehicleCreatedKey] = lastVehicleCreated;
		server.UpdateUserInternalData(
		{
			PlayFabId: playerId,
			Data: newInternalData
		});
	}
	
	// Check we already created all we need
	if (lastVehicleCreated == PlayerMasteryVehicles.length)
	{
		// Nothing more to do
		return {AllCreated :true};
	}
	// Check if first attempt
	else if (lastVehicleCreated == -1)
	{
		// Skip This time, player being Created
		var vTotalCreated = 0;
		log.info("InitialisePlayerCharacters: Initial : " + vTotalCreated);
		
		// Need to Update Created Count
		var updateCreatedInternalData = {};
		updateCreatedInternalData[vehicleCreatedKey] = vTotalCreated;
		log.info("MasteryVehicleCreated - WRITE = " + vTotalCreated);
		server.UpdateUserInternalData(
		{
			PlayFabId: playerId,
			Data: updateCreatedInternalData
		});	
		return {AllCreated :false};
	}
	
	// Check Number of Entries to Process
	var numCharactersToCreate = 5;
	log.info("InitialisePlayerCharacters: Length : " + PlayerMasteryVehicles.length + " last : " + lastVehicleCreated +  " numCreate : " + numCharactersToCreate);
	if ( (PlayerMasteryVehicles.length - lastVehicleCreated) < numCharactersToCreate)
	{
		// Trim value
		numCharactersToCreate = (PlayerMasteryVehicles.length - lastVehicleCreated);
		// log.info("InitialisePlayerCharacters: Trimmed : " + numCharactersToCreate);
	}

	// Check if first attempt
	if (lastVehicleCreated == 0)
	{
		// Trim value
		numCharactersToCreate = 1;
		log.info("InitialisePlayerCharacters: Limit : " + numCharactersToCreate);
	}
	
	// Grant next lot vehicle to player
	var vIndex = lastVehicleCreated;
	var vTotalCreated = lastVehicleCreated;
	for(var vCreated=0; vCreated < numCharactersToCreate; vCreated++)
	{
		// Check index is Valid
		if ( vIndex < PlayerMasteryVehicles.length)
		{
			var vehicle = PlayerMasteryVehicles[vIndex];

			// Display what vehicle being processed
			// log.info("InitialisePlayerCharacters: [" + vIndex +  "] : " + vehicle.Name + " : " + vehicle.Type);

			// Grant Mastery Vehicles (Playfab Characters) 
			var giveMasteryVehiclesResult = server.GrantCharacterToUser(
			{
				PlayFabId: playerId,
				CharacterName  : vehicle.Name,
				CharacterType : vehicle.Type
			});
			
			// Check Character Granted?
			if(giveMasteryVehiclesResult && giveMasteryVehiclesResult["CharacterId"])
			{
				// Extract CharacterId, needed for creating Data fields
				var characterId = giveMasteryVehiclesResult["CharacterId"];
				log.info("InitialisePlayerCharacters: CharacterId : " + characterId);
				vehicle.CharId = characterId;
				
				// Set MasteryVehicle Default Data
				var seasonKey = "CurrentSeasonID";
				var newMasterVehicleData = {};
				newMasterVehicleData["Name"] = vehicle.Name;
				newMasterVehicleData["Class"] = vehicle.Type;
				newMasterVehicleData["Level"] = 0;
				newMasterVehicleData["XP"] = 0;

				// Set Default Character Details
				server.UpdateCharacterReadOnlyData(
				{
					PlayFabId: playerId,
					CharacterId: characterId,
					Data: newMasterVehicleData,
					Permission: "Public"
				});

				// log.info("InitialisePlayerCharacters: Processed: Result:" + " [" + vIndex +  "] : " + vehicle.Name + " : " + vehicle.Type + " CharacterId: " + characterId);
			}
			else
			{
				// Missing 
				log.error("InitialisePlayerCharacters: Missing : [\"CharacterId\"] Field");
			}

			// Allow Access to next Index
			vIndex++;
			vTotalCreated++;
		}
	}
	
	// Need to Update Created Count
	var updateCreatedInternalData = {};
	updateCreatedInternalData[vehicleCreatedKey] = vTotalCreated;
	log.info("MasteryVehicleCreated - WRITE = " + vTotalCreated);
	server.UpdateUserInternalData(
	{
		PlayFabId: playerId,
		Data: updateCreatedInternalData
	});	
	
	
	var allCharactersCreated = false;
	// Check we completed all Vehicles
	// Should Store details on Player Data
	if (lastVehicleCreated == PlayerMasteryVehicles.length)
	{	
		allCharactersCreated = true;
		var vNumInfo = PlayerMasteryVehicles.length;
		for(var vInfo=0; vInfo < vNumInfo; vInfo++)
		{
			var vehicle = PlayerMasteryVehicles[vIndex];
			log.info("Characters: [" + vIndex +  "] : [" + vehicle.Name + "] Type: [" + vehicle.Type + "] CharID [" + vehicle.CharId + "]" );
		}
	}

	// Showing we are entering function
	// log.info("InitialisePlayerCharacters -- Leaving");
    return {AllCreated :allCharactersCreated};
}


function GetMasteryVersion()
{
	// Challenges Version History
	var VehicleMasteryVersion = 0.1;	// Added "RewardCosmetic" to Challenges
	return VehicleMasteryVersion;
}



function InitialiseMasteryDataTable(args)
{
	var renew = false; 
	var version = GetMasteryVersion();

	// >>>> Playfab Server Call <<<<
	var interalData = server.GetUserInternalData( {	PlayFabId: args.PlayerUID,	Keys:["MasteryVehicleVersion"] 	});
	
	// if version mismatch
	if(interalData.Data["MasteryVehicleVersion"] )
	{		
		if(interalData.Data["MasteryVehicleVersion"].Value != version)
		{
			renew = true;				
		}	
		else // Versions are the same
		{
			renew = false;				
		}
	}
	else
	{
		renew = true;				
	}
	
		
// >>>> Playfab Server Call <<<<
 	var readonlyData = server.GetUserReadOnlyData( {PlayFabId: args.PlayerUID,	Keys:["VehicleMasteryProgress"] });
	//no table		
	if(!readonlyData.Data["VehicleMasteryProgress"])
	{
		renew = true;
	}
	
	
	
	// DOESNT EXIST, then Create it
	if(renew)
	{
		var titledata = server.GetTitleData({Keys:["VehicleMasteryTemple"]});		

		if(titledata.Data["VehicleMasteryTemple"] )
		{						
			var outData = {};		
			outData["VehicleMasteryProgress"] = titledata.Data["VehicleMasteryTemple"];
			
			
	// >>>> Playfab Server Call <<<<	
			var updateReadonly = server.UpdateUserReadOnlyData({  PlayFabId: args.PlayerUID, Data: outData});
			
			// VERSION
			var outinternal={};
			outinternal["MasteryVehicleVersion"] = version;
	// >>>> Playfab Server Call <<<<	
			server.UpdateUserInternalData(  {PlayFabId: args.PlayerUID, Data: outinternal});	
			
		}
	}

	return {};
}










handlers.onInitialisePlayerCharacters = function(args)
{
	var argsJSon = JSON.parse(args);
    return InitialisePlayerCharacters(argsJSon.PlayerUID);	
}



handlers.onInitialiseMasteryDataTable = function(args)
{
	var argsJSon = JSON.parse(args);
    return InitialiseMasteryDataTable(argsJSon);	
}