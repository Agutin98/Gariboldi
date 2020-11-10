const express = require('express');
const router = express.Router();
const Match = require('../models/match');
const cheerio = require('cheerio');
const request = require('request-promise');
const cron = require('node-cron');
const Leicester = require('../models/Leicester');
const match = require('../models/match');
const compSeasonsId = [363, 274, 210, 79, 54, 42, 27, 12, 10, 9, 8, 7 ,6, 5, 3];

let cronTask = (req, res) => {
    getSeasons();
    getMatches();
    cron.schedule('* * */24 * * *', () => {
        getSeasons();
        getMatches();
    }
)}

async function getMatches(){
    Match.deleteMany({}, async function(err, result){
        if(err) console.log(err);
        else{
            console.log('coleccion match eliminada con exito!')
            const baseUri = "https://footballapi-lcfc.pulselive.com/football/fixtures?teams=26&comps=1,4,5,2,210,3&compSeasons="
            const finishUri = "&homeTeams=&page=0&pageSize=100&sort=desc&statuses=C&altIds=true&provisional=false&detail=2"
            for(let i in compSeasonsId){
                let uri = baseUri + compSeasonsId[i] + finishUri;
                let matches = await request({uri});

                matches = (JSON.parse(matches)).content;

                matches.forEach(match => {
                    let matchFinished = {
                        startDate: new Date(match.kickoff.millis),
                        teams: match.teams,
                        location: {
                            name: match.ground.name,
                            city: match.ground.city
                        },
                        id: match.id
                    }
                    const MatchFinished = new Match(matchFinished);
                    MatchFinished.save();
                    //console.log('partido agregado')
                })
            }
        }
    })
}

async function getSeasons(){
    Leicester.deleteMany({}, async function(err, result){
        if(err) console.log(err);
        else{
            const baseUri = 'https://footballapi-lcfc.pulselive.com/football/standings?compSeasons=';
            const finishUri = '&altIds=true&detail=2';
            for(let i in compSeasonsId){
                let uri = baseUri + compSeasonsId[i] + finishUri;
        
                let compSeason = await request({uri: uri});
                compSeason = JSON.parse(compSeason);
        
                compSeason.tables.forEach(entry => {
                    entry.entries.forEach(async entr => {
                        if(entr.team.name == 'Leicester City'){
                            let startSeason = await formatDate(compSeason.compSeason.label);
                                let leicester = {
                                    label: compSeason.compSeason.label,
                                    startSeason: startSeason,
                                    points: entr.overall.points
                                };
                                console.log("leicester", leicester)
                            let LeicesterSeason = new Leicester(leicester)
                            LeicesterSeason.save();
                        }
                    })
                }) 
            }
        }
    })
}

async function formatDate(labelSeason){
    // + Format Season Date for save in Db. 
    let year = (labelSeason.slice(0, 4));
    startYear = year + '/01/01';
    let startSeason = new Date(startYear)

    return startSeason
    //- Format Season Date for save in Db.
}

module.exports = cronTask