const express = require('express');
const Leicester = require('../models/Leicester');
const match = require('../models/match');
const router = express.Router();
const Match = require('../models/match');

// Add Match 
// I have to do this way because I was facing a bug with Postman that I wasn't able to fix.
// (Postman POST request doesn't give me any req.body) 
router.post('/addMatch', (req, res) => {
    let match = {
        startDate: new Date(2020-11-09),
        teams: [
            {
            team: {
                name: "Leicester City",
                club: {
                    name: "Leicester City",
                    shortName: "Leicester",
                    abbr: "LEI",
                    id: 26
                },
                testType: "FIRST",
                shortName: "Leicester",
                id: 26,
                altIds: {
                    opta: "t13"
                },
                
            }, score: 3
        },
        {
            team: {
                name: "Sheffield United",
                club: {
                    name: "Sheffield United",
                    shortName: "Sheffield Utd",
                    abbr: "SHU",
                    id: 18
                },
                testType: "FIRST",
                shortName: "Sheffield Utd",
                id: 18,
                altIds: {
                    opta: "t42"
                },
                
            }, score: 0
        },
    ],
    location: {
        name: "King Power Stadium", 
        city: "Leicester"
    },
    id: 46960
    }

    const params = req.body;
    if (match.teams.length != 2){
        res.send('Tienen que haber solo 2 equipos jugando el partido.')
    }
    if (match.startDate > new Date() && match.eventStatus == 'Completed'){
        res.send('El partido aun no se ha jugado, su eventStatus debe estar en Pending')
    }

    Match.create(match)
      .then((data) => {
        console.log('create match', data);
        return res.status(200).json(data);
      })
      .catch((error) => {
        return res.status(400).json({
          message: error.message || 'no se pudo crear partido',
          error
        });
      });
})

router.post('/', (req, res) => {
    console.log(req.body)
})

// Interval Filter by date
router.get('/interval', (req, res) => {
    let filter = {
        startDate:{}
    };

    if(req.query.startDate){
        filter.startDate.$gte = new Date(req.query.startDate);
    }

    if(req.query.endDate){
        filter.startDate.$lte = new Date(req.query.endDate);
    }

    if(!req.query.startDate || !req.query.endDate){
        res.status(500).send('Falta un parametro de busqueda, asegurese de ingresar un intervalo correcto.')
    }

    Match.find(filter).then(response => {
        res.json(response);
    })
})

// Result of the lastMatch
router.get('/lastMatch', (req, res) => {

    // Find the nearest match date of today's date
    Match.aggregate([{
        $project : {
            myDate : 1,
            otherData : 1,
            difference : {
                $abs : { $subtract : [new Date(), "$startDate"]}
            }
        }
    },
        { $sort : { difference : 1 }},
        { $limit : 1}
    ])
    .then(resp => {
        Match.findById(resp[0]._id).then(response => {
            res.send(
                'El resultado del partido fue: '
                + response.teams[0].team.name + ' ' 
                + response.teams[0].score + ' - ' 
                + response.teams[1].score + ' ' 
                + response.teams[1].team.name
                );
        }).catch(error => {
            res.send(500).send(error);   
        })
    })
    .catch(err => {
        res.send(500).send(err);
    })
})

// Every match with date or id
router.get('/getByIdOrDate', async (req, res) => {
    let filter = {};

    if(req.query.startDate){
        filter.startDate = new Date(req.query.startDate)
    }

    if(req.query.id){
        filter.id = req.query.id;
    }
    
    Match.findOne(filter).then(response => {
        if(!response){
            res.send('No hay ningun partido con esos dos parametros, por favor intente que coincidan o solo mande un parametro.');
        } else {
            res.send(
                'El resultado del partido fue: '
                + response.teams[0].team.name + ' ' 
                + response.teams[0].score + ' - ' 
                + response.teams[1].score + ' ' 
                + response.teams[1].team.name
            );
        }   
    }).catch(error => {
        res.send(error)
    })
})

router.get('/rangePoints', (req, res) => {
    let filter = {
        startSeason:{}
    };

    if(req.query.start){
        filter.startSeason.$gte = new Date(req.query.start);
    }

    if(req.query.end){
        filter.startSeason.$lte = new Date(req.query.end);
    }

    Leicester.find(filter).then(response => {
        if(response.length == 1){
            res.send(
                'los puntos de la temporada '+
                response[0].label + ' han sido: '+
                response[0].points + ' puntos.'
            )
        } else {
            res.send('Hay varios resultados, por favor acote mas la busqueda (Cada temporada dura un año.)')
        }

    });
})

router.get('/mostGoals', (req, res) => {
    Match.find().then(response => {
        let teams = []
        response.forEach(match => {
            match.teams.forEach(team => {
                if (team.team.name != 'Leicester City'){
                    let teamToPush = {
                        name: team.team.name,
                        goals: team.score
                    } 
                    if(teams.find(el => el.name == team.team.name)){
                        let rivalTeam = teams.find(el => el.name == team.team.name);
                        rivalTeam.goals = rivalTeam.goals + team.score;
                        teams = teams.filter(el => el.name != team.team.name);
                        teams.push(rivalTeam);
                    } else {
                        teams.push(teamToPush);
                    }
                }
            })
        })
        let maxScore = teams[0]
        for(let t in teams){
            if (teams[t].goals > maxScore.goals) maxScore = teams[t];
        }
        res.send(
            'El equipo que mas goles le ha hecho a Leicester FC hasta el momento es '+
            maxScore.name + ' con '+ maxScore.goals+ ' goles.'
        )
    })
});

module.exports = router;