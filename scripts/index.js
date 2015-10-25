$(document).ready(function(){
    var landingRactive = new Ractive({
        el:"#landing",
        template:"#landing-template",
        data:{
            region:"NA"
        }
    });
    var key;
    var CHAMPS_PER_ROW = 8;
    var resources = $.getJSON('messages/resources.json');
    var allMasteries = {};
    var allChampions = [];
    $.when(resources).done(function(r) {
        //key = r.apiKey;
        key = apiKey_tmp;

        var url = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/mastery?api_key=' + key;
        var allMasteriesRequest = $.ajax({
            url: url,
            dataType: 'json',
            type: "GET"
        });

        $.when(allMasteriesRequest).done(function(m){
            allMasteries = m.data;
        });

        var champsUrl = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=image&api_key=' + key;
        var champsRequest = $.ajax({
            url: champsUrl,
            dataType: 'json',
            type: "GET"
        });

        $.when(champsRequest).done(function(champions){
            console.log(champions.data.Rengar);
            var championNames = [];
            for(var key in champions.data){
                allChampions.push({
                    name:champions.data[key].name,
                    image:'http://ddragon.leagueoflegends.com/cdn/5.20.1/img/champion/' + champions.data[key].image.full,
                    title:champions.data[key].title,
                    id:champions.data[key].id
                });
            }
            allChampions.sort(function(a,b){
                return a.name.localeCompare(b.name);
            });

            var champRow = [];
            var rowCount = 0;
            var championDisplay = [];
            allChampions.forEach(function(champ){
                console.log(champ);
                champRow.push(champ);
                rowCount++;
                if(rowCount == CHAMPS_PER_ROW){
                    championDisplay.push(champRow);
                    champRow = [];
                    rowCount = 0;
                }
            });
            championDisplay.push(champRow);
            landingRactive.set('champions', championDisplay);
        });
    });

    landingRactive.on('showChampSelect', function(){
        landingRactive.set('champSelectActive', true);
    });

    landingRactive.on('selectChampion', function(event, champion){
        landingRactive.set('selectedChampion', champion);
        landingRactive.set('champSelectActive', false);
    });

    landingRactive.on('getSummoner', function(){
        console.log('getSummoner');
        console.log(allChampions);
        var summoner = landingRactive.get('summonerName');

        console.log(key);
        var url = 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/' + summoner + '?api_key=' + key;
        var request = $.ajax({
            url: url,
            dataType: 'json',
            type: "GET",
            error: function(request, status, errorThrown){
                if(errorThrown == 'Not Found'){
                    landingRactive.set('summonerRank', 'Summoner Not Found');
                }
            }
        });

        $.when(request).done(function(s){
            console.log(s);
            for(var summoner in s){
                console.log(s[summoner].id);
                var id = s[summoner].id;

                var masteryUrl = 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/'+ id + '/masteries?api_key=' + key;
                var masteriesRequest = $.ajax({
                    url: masteryUrl,
                    dataType: 'json',
                    type: "GET"
                });

                $.when(masteriesRequest).done(function(masteries){
                    var masteryPages = [];
                    masteries[id].pages.forEach(function(page){
                        var masteryPage = {};
                        masteryPage.name = page.name;
                        masteryPage.masteries = page.masteries;
                        masteryPages.push(masteryPage);
                    });
                    console.log(masteryPages);
                });

                var rankedUrl = 'https://na.api.pvp.net/api/lol/na/v2.5/league/by-summoner/'+id+'?api_key='+key;
                var rankedRequest = $.ajax({
                    url: rankedUrl,
                    dataType: 'json',
                    type: "GET",
                    error: function(request, status, errorThrown){
                        if(errorThrown == 'Not Found'){
                            landingRactive.set('summonerRank', 'Unranked');
                        }
                    }
                });
                $.when(rankedRequest).done(function(ranked){
                    console.log(ranked);
                    var stats = ranked[id];
                    for(var i = 0; i < stats.length; i++){
                        if(stats[i].queue == "RANKED_SOLO_5x5"){
                            var participantId = stats[i].participantId;
                            var entries = stats[i].entries;
                            var tier = stats[i].tier;
                            var division = '';
                            var leaguePoints = '';
                            for(var j = 0; j < entries.length; j++){
                                if(entries[j].playerOrTeamId == participantId){
                                    division = entries[j].division;
                                    leaguePoints = entries[j].leaguePoints;
                                }
                            }
                            console.log(tier + ' ' + division + ' - ' + leaguePoints);
                            var rank = tier + ' ' + division + ' - ' + leaguePoints + ' LP';
                            landingRactive.set('summonerRank', rank);
                        }
                    }
                });

                var runes_data = {}; /* static rune data */
                var runesDataUrl = "https://global.api.pvp.net/api/lol/static-data/na/v1.2/rune?runeListData=stats&api_key="+key;
                var runeDataRequest = $.ajax({
                    url: runesDataUrl,
                    dataType: 'json',
                    type: "GET"
                });

                $.when(runeDataRequest).done(function(rune_d){

                    for(var prop in rune_d.data){
                        var stats = {};
                        stats = rune_d.data[prop].stats;
                        runes_data[rune_d.data[prop].id] = stats;
                    }

                    var runesUrl = 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/' + id + '/runes?api_key=' + key;
                    var runesRequest = $.ajax({
                        url: runesUrl,
                        dataType: 'json',
                        type: "GET"
                    });



                    $.when(runesRequest).done(function(runes_j){
                        //console.log(runes_j);
                        var runes = runes_j[id].pages;
                        var rune_pages = [];


                        for(var i = 0; i < runes.length; i++){
                            var rune_stats = {};

                            for(var j = 0; j < runes[i].slots.length; j++){
                                var stats = runes_data[runes[i].slots[j].runeId];
                                for (var prop in stats){
                                    console.log("prop: " + prop);
                                    if (rune_stats.hasOwnProperty(prop)){
                                        rune_stats[prop] += stats[prop];
                                    } else {
                                        rune_stats[prop] = stats[prop];
                                    }
                                }
                            }

                            var rune_page = {
                                "name" : "",
                                "stats" : {}
                            }

                            rune_page.name = runes[i].name;
                            rune_page.stats = rune_stats;

                            rune_pages.push(rune_page);
                        }

                    });
                });
            }
        });
        landingRactive.set('currentSummoner', landingRactive.get('summonerName'));
        return false;
    })
});