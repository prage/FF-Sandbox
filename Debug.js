
function DebugAddMastery(args)
{
	log.info("Debug Add MAster XP");
	var internalData = server.GetUserReadOnlyData(  // >>>> Playfab Server Call <<<<
	{
		PlayFabId: args.PlayerUID,
		Keys:[ "VehicleMasteryProgress" ] 
	});
	var titledata = server.GetTitleData({Keys:["MasteryVehicleRewards"]});
	var masteryLevels = JSON.parse(titledata.Data["MasteryVehicleRewards"]);

	if(internalData.Data["VehicleMasteryProgress"] )
	{			
		var masteryProgressTable = JSON.parse(internalData.Data["VehicleMasteryProgress"].Value);	
		
		for(var i=0; i<masteryProgressTable.length; i++)
		{		
			if( masteryProgressTable[i].MasteryVehicle == args.Vehicle )
			{
				masteryProgressTable[i].XP += args.XP;
				var newLvl = GetMasteryLevel(masteryLevels, masteryProgressTable[i].XP);
				masteryProgressTable[i].Level = newLvl;
				log.info("XP" + args.XP);
				break;
			}
		}
		
		var outData = {};		
		outData["VehicleMasteryProgress"] = JSON.stringify(masteryProgressTable);
	
		var updateReadonly = server.UpdateUserReadOnlyData({  // >>>> Playfab Server Call <<<<
								PlayFabId: args.PlayerUID,
								Data: outData});
	}
	return {};
}

function DebugAddMasteryForAllVehicles(args)
{
	var internalData = server.GetUserReadOnlyData(  // >>>> Playfab Server Call <<<<
	{
		PlayFabId: args.PlayerUID,
		Keys:[ "VehicleMasteryProgress" ] 
	});
	var titledata = server.GetTitleData({Keys:["MasteryVehicleRewards"]});
	var masteryLevels = JSON.parse(titledata.Data["MasteryVehicleRewards"]);

	if(internalData.Data["VehicleMasteryProgress"] )
	{			
		var masteryProgressTable = JSON.parse(internalData.Data["VehicleMasteryProgress"].Value);	
		
		for(var i=0; i<masteryProgressTable.length; i++)
		{				
			masteryProgressTable[i].XP += args.XP;
			var newLvl = GetMasteryLevel(masteryLevels, masteryProgressTable[i].XP);
			masteryProgressTable[i].Level = newLvl;		
		}
		
		var outData = {};		
		outData["VehicleMasteryProgress"] = JSON.stringify(masteryProgressTable);
	
		var updateReadonly = server.UpdateUserReadOnlyData({  // >>>> Playfab Server Call <<<<
								PlayFabId: args.PlayerUID,
								Data: outData});
	}
	return {};
}



handlers.onDebugAddMastery = function(args)
{	
	var jsonArgs = JSON.parse(args);
	return DebugAddMastery(jsonArgs);
}

handlers.onDebugAddMasteryForAllVehicles = function(args)
{	
	var jsonArgs = JSON.parse(args);
	return DebugAddMasteryForAllVehicles(jsonArgs);
}