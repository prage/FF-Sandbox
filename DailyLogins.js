

// This needs fixing.
function DebugAddLoginUpdate()
{
	var now = new Date();		// Date
	var lastLogin = now.getTime();	// miliseconds
	
	var userData = server.GetUserReadOnlyData(
	{
		PlayFabId: currentPlayerId,
		Keys: ["DailyLogins"]
	});

	if (userData.Data["DailyLogins"])
	{			
		var CurrentLoginsJsonArray = JSON.parse(userData.Data["DailyLogins"].Value);				
		
		// Update Challenges Rollover Count
		IncrementDailyChallengeRollover(currentPlayerId);
		
		var updateData = {};
		if(CurrentLoginsJsonArray.length >=28)
		{
			var LastLoginDate = [ lastLogin ];          
			updateData["DailyLogins"] = JSON.stringify(LastLoginDate);
		}
		else
		{
			CurrentLoginsJsonArray.push(lastLogin);				
			updateData["DailyLogins"] = JSON.stringify(CurrentLoginsJsonArray);
		}			
		
		server.UpdateUserReadOnlyData(  {
			PlayFabId: currentPlayerId,
			Data: updateData
			});					
	}
	else
	{
		// Update Challenges Rollover Count
		IncrementDailyChallengeRollover(currentPlayerId);
		
		var newdata={};
		var LastLoginDate = [ lastLogin ];
		newdata["DailyLogins"] = JSON.stringify(LastLoginDate);

		server.UpdateUserReadOnlyData(  {
			PlayFabId: currentPlayerId,
			Data: newdata
		});			
	}	
	return {};
} 





// Return the award list
// Return current award
// Return flag whether todays needs claiming.
// What the current day is.
function GetLoginAwards()
{	    
    var DaysLoggedIn = 0;
    var currentRewardDay = 0;
	var isNewLogin = false;
	
	var profileInfo = server.GetUserAccountInfo({PlayFabId : currentPlayerId});
	
	if(profileInfo.UserInfo.TitleInfo.LastLogin)
	{	
		var lastLoginDate = profileInfo.UserInfo.TitleInfo.LastLogin;
		var arrayOfStrings = lastLoginDate.split('T');	
		var lastLogin = Date.parse(arrayOfStrings[0]);					
		
		var userData = server.GetUserReadOnlyData(
		{
			PlayFabId: currentPlayerId,
			Keys: ["DailyLogins", "ClaimedRewardDay"]
		});
	
	
		if (userData.Data["DailyLogins"])
		{			
			var DailyLogins = JSON.parse(userData.Data["DailyLogins"].Value);		
		
			// How many rewards currently
			if (userData.Data["ClaimedRewardDay"])
			{
				currentRewardDay = userData.Data["ClaimedRewardDay"].Value;
			}
			
			// Is todays login date in the array. 
			// if not, that means its new
			if( DailyLogins.includes(lastLogin) == false)
			{
				isNewLogin = true;	
				IncrementDailyChallengeRollover(currentPlayerId);
		
				// If the array has 28 entries, we need to start Fresh again. But not reset the array/write into it until we claim
				if( DailyLogins.length >=28)				
				{
					DaysLoggedIn = 0;
					currentRewardDay = 0;
				}
				else
				{
					DaysLoggedIn = DailyLogins.length;		
				}
			}		
			else
			{
				DaysLoggedIn = DailyLogins.length;		
			}
		}	
	}
	
	
	var retData = {};
    retData["DaysLoggedIn"] = DaysLoggedIn;
    retData["ClaimedRewardDay"] = currentRewardDay;
    retData["IsNewLogin"] = isNewLogin;

	
	var loginRewards = server.GetTitleData({Keys:["DailyLoginRewards"]});
    if(loginRewards.Data["DailyLoginRewards"])
	{  // Get the award table
		retData["DailyLoginRewards"] = loginRewards.Data["DailyLoginRewards"];
    }    
    return retData;
}





function ClaimLoginReward()
{
	var profileInfo = server.GetUserAccountInfo({PlayFabId : currentPlayerId});
	var titleInternalData = server.GetTitleData({Keys:["DailyLoginRewards"]});
    var readOnlyData = server.GetUserReadOnlyData({PlayFabId: currentPlayerId, Keys: ["DailyLogins", "ClaimedRewardDay"]});
  	var claimedRewardDay = 0;
	var claimedBP = 0;
	var claimedBC = 0;
	var claimSuccess = false;
	var latestLogin = 0;
	
	if (readOnlyData.Data["ClaimedRewardDay"])
	{
		currentRewardDay = readOnlyData.Data["ClaimedRewardDay"].Value;
	}
			
	if(profileInfo.UserInfo.TitleInfo.LastLogin)
	{	
		var lastLoginDate = profileInfo.UserInfo.TitleInfo.LastLogin;
		var arrayOfStrings = lastLoginDate.split('T');	
		var lastLogin = Date.parse(arrayOfStrings[0]);	
		var currentLogins = JSON.parse(readOnlyData.Data["DailyLogins"].Value);
       var retData = {};	
		latestLogin = lastLogin;
	   //Is todays login in the list
		if( currentLogins.includes(lastLogin) == false)
		{				
			// Update Challenges Rollover Count
					
			var updateData = {};
			
			if(currentLogins.length >=28 )// 29th entry goes into a fresh array
			{				
				// Reset the Array
				currentLogins = [ ];
			}

			// Add to the array		
			currentLogins.push(lastLogin);				
			updateData["DailyLogins"] = JSON.stringify(currentLogins);
			claimedRewardDay = currentLogins.length;				
				
			
			                  

					
			updateData["ClaimedRewardDay"] = claimedRewardDay;
			var Reward = {};
			var RewardList = titleInternalData.Data["DailyLoginRewards"];
			var parsedRewardsList = JSON.parse(RewardList);
			
			for(var i=0; i<parsedRewardsList.length; ++i)
			{   
				if(parsedRewardsList[i].Day==claimedRewardDay)
				{
					Reward = parsedRewardsList[i];
					
					var Day = Reward.Day;
					var BC = Reward.BC;
					var BP = Reward.BP;
					var Boost = Reward.Boost;
				   
					if(BC>0)
					{
						var data = {};
						data["PlayFabId"] = currentPlayerId;
						data["VirtualCurrency"] = "BC";
						data["Amount"] = BC;
						claimedBC = BC;
						var ret = server.AddUserVirtualCurrency(data);						
					}
					if(BP>0)
					{
						var data = {};
						data["PlayFabId"] = currentPlayerId;
						data["VirtualCurrency"] = "BP";
						data["Amount"] = BP;
						claimedBP = BP;
						var ret = server.AddUserVirtualCurrency(data);						
				   }					
				}
			}	   
	  
			// Write out the login history
			server.UpdateUserReadOnlyData(  {
				PlayFabId: currentPlayerId,
				Data: updateData
				});		
			claimSuccess = true;
		}
		else
		{
			// Just incase we hit the claim button twice.
			// the return values are parsed and cached in playfabnetservices.
			var currentLogins = JSON.parse(readOnlyData.Data["DailyLogins"].Value);
			claimedRewardDay = currentLogins.length;
		}
	}
	retData["success"] = claimSuccess;
	retData["claimedBP"] = claimedBP;
	retData["claimedBC"] = claimedBC;
    retData["ClaimedRewardDay"] = claimedRewardDay;
    retData["DaysLoggedIn"] = currentLogins.length; 
    retData["IsNewLogin"] = false;
	retData["LatestLogin"] = latestLogin;
    return retData;
}








handlers.onGetLoginRewards = function(args)
{
     return GetLoginAwards();
}

handlers.onClaimRewards = function(args)
{
    var argsJSon = JSON.parse(args);
    return ClaimLoginReward(argsJSon);
}




function UpdateLogins()
{
	

	return{};
}


handlers.onLoginUpdate = function(args)
{
    return UpdateLogins();	
}
