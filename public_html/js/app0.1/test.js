var dataObj = new DataClass('people',[
	'firstname',
	'lastname',
	'birthdate',
	'haircolor',
	'eyecolor'
]);

dataObj.create(
	{
		firstname : 'Joe',
		lastname : 'Smith'
	}
).update(
	{
		firstname : 'Joe',
		lastname : 'Smith'
	}, {
		lastname : 'Jones',
		eyecolor : 'blue'
	}
).create(
	{
		firstname : 'Bob',
		lastname : 'Barker'
	}
).delete(
	// {
	// 	firstname : 'Bob'
	// }
).out();