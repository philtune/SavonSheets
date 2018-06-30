<?php

class Property
{
	private $prop;

	public function __construct($value) {
		$this->prop = $value;
	}

	public function setValue($value)
	{
		$this->prop = $value;
		echo 'prop was set to '.$this->prop;
	}

	public function __toString()
	{
		return $this->prop;
	}

	public function stripped()
	{
		return strip_tags($this->prop);
	}

}

class Module
{

	private $data = [];

	public function __construct(array $props=[]) {
		foreach ( $props as $name => $value ) {
			$this->data[$name] = new Property($value);
		}
	}

	public function __set($name, $value)
	{
		if ( isset($this->data[$name]) ) {
			$this->data[$name]->setValue($value);
		} else {
			$this->data[$name] = new Property($value);
		}
	}

	public function __get($name)
	{
		if (array_key_exists($name, $this->data)) {
			return $this->data[$name];
		}
		return null;
	}

	public function __isset($name)
	{
		return isset($this->data[$name]);
	}

	public function __unset($name)
	{
		unset($this->data[$name]);
	}

}

$module = new Module([
	'foo' => 'bar'
]);

echo '<br>4. echo $module->foo;<br>';
echo $module->foo;
echo '<br>1. $module->foo = ...;<br>';
$module->foo = 'Hey<br/>There';
echo '<br>2. var_dump($module->foo);<br>';
var_dump($module->foo);
echo '<br>3. var_dump($module->foo->stripped());<br>';
var_dump($module->foo->stripped());