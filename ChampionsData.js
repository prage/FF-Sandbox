
// Code to get data for the 'Hall of Champions'
function GetChampionData()
{
  var kChampionsListKey = "SeasonChampions2";
  var playerId = currentPlayerId;
  var titleData = server.GetTitleInternalData({Keys:[kChampionsListKey]});
  var championsData = {};

   
  var championIdList = JSON.parse(titleData.Data[kChampionsListKey]);
  
  log.info(championIdList);
  championsData.championList = []
  for(var k=1; k<=3; k++)
  {
	  
	var pos = k.toString();
	
	if(championIdList[pos])
	{
        
		var champ = {}		
		
		// Get champion account info
		var accountInfo = server.GetUserAccountInfo({PlayFabId : championIdList[pos]});
        var message = "Champion "+ accountInfo;
		log.info(message);
        
        
		if (accountInfo.UserInfo.TitleInfo.DisplayName)
		{
			champ.name = accountInfo.UserInfo.TitleInfo.DisplayName;
		}
		else
		{
			var profileInfo = server.GetPlayerProfile({PlayFabId : championIdList[pos]});
			if(profileInfo.PlayerProfile.DisplayName)
			{
				champ.name = profileInfo.PlayerProfile.DisplayName;
			}
		}
		champ.info = accountInfo;
		champ.playfabid = championIdList[pos];
		champ.position = k;
		
		if(accountInfo.UserInfo.SteamInfo)
		  champ.steamid =   accountInfo.UserInfo.SteamInfo.SteamId;
		
		
		// Get Champion Character Customisation Info
		champ.cust = {}
		var custData = GetCharacterCustData(championIdList[pos]); 
		if(custData.Data["CharacterCustomisation"].Value)
		{
			champ.cust = JSON.parse(custData.Data["CharacterCustomisation"].Value);
		}
		  
		championsData.championList.push(champ);
	}
  }
  return championsData;
}

handlers.getChampionsData = function(args)
{ 
  return GetChampionData();
}
