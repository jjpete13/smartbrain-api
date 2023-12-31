const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cors = require("cors");
const knex = require('knex');

const database = knex({
  client: 'pg',
  connection: {
    host : 'dpg-cjv1mjd175es73ceea3g-a',
    port: '5432',
    user : 'smartbrain_database_bbab_user',
    password: 'Cihu7FNkUW8zXHlgP3D1kk8YtfYCRg79',
    database : 'smartbrain_database_bbab'
  }
});

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users)
})

app.post('/signin', (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json('incorrect form submission')
	}
	database.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	.then(data => {
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if (isValid) {	
			return database.select('*').from('users')
			.where('email', '=', req.body.email)
			.then(user => {
			res.json(user[0])	
			})
			.catch(err => res.status(400).json('unable to get user'))
		} else {
			res.status(400).json('wrong credentials')
		}
	})
	.catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
	const { email, name, password } = req.body;
	if (!email || !name || !password) {
		return res.status(400).json('incorrect form submission')
	}
	const hash = bcrypt.hashSync(password, saltRounds);
		database.transaction(trx => {
			trx.insert({
				hash: hash,
				email: email
			})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
		.returning('*')
		.insert({
			email: loginEmail[0].email,
			name: name,
			joined: new Date()
	}).then(user => {
		res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})	
	.catch(err => {
		res.status(400).json('unable to register')
		})
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	database.select('*').from('users').where({id})
		.then(user => {
			if (user.length) {
		res.json(user[0]);	
		} else {
		res.status(400).json('unable to find user')	
		}
	})
	.catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
	const { id } = req.body;
	database('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => res.json(entries[0].entries))
	.catch(err => res.status(400).json('unable to update entries'))
})

app.listen(3000, () => console.log('app is running smoothly'))