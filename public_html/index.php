<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>Savon Sheets</title>
	<!-- <link rel="stylesheet" href="/css/style.css"> -->
	<style>
	body { background: #555555; color: white; }
	</style>
</head>
<body>

	<!-- <form action="" method="GET">
		<fieldset>
			<legend>oils</legend>
			<div id="oil_rows">
				<div class="row">
					<input type="number" name="oil[#][weight]" />oz
					<input type="number" name="oil[#][percent]" />%
				</div>
			</div>
			<button data-app="add_oil #oil_rows">Add</button>
		</fieldset> -->
			<!-- <br><input type="number" name="oil[1][weight]" />oz
			<input type="number" name="oil[1][percent]" />% -->
			<!-- <input type="checkbox" name="foo[]" value="1">
			<input type="checkbox" name="foo[]" value="2"> -->
		<!-- <button type="submit">Submit</button>
	</form> -->
	<?php echo 'foo'; ?>
	<?php
	// if ( $_GET ) {
	// 	var_dump($_GET);
	// }
	?>
	<style>
	body {
		font-family: serif;
	}
	h1, h2, h3, h4, h5, h6 {
		font-family: sans-serif;
	}
	.columns {
		display: table;
	}
	.columns-col {
		display: table-cell;
		padding: 0 16px;
	}
	.pre {
		font-family: 'Courier New';
		font-size: 14px;
		tab-size: 4;
	}
	</style>
	<div class="columns">
		<div class="columns-col">
			<h4>Oils</h4>
			<pre class="pre" id="oils_data"></pre>
		</div>
		<div class="columns-col">
			<h4>Formula</h4>
			<pre class="pre" id="formula_data"></pre>
		</div>
		<div class="columns-col">
			<pre class="pre" id="output3"></pre>
		</div>
	</div>
	
	<!-- <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script> -->
	<script src="/js/jquery-2.2.4.js"></script>
	<script src="/js/library.js"></script>
	<script src="/js/data.class.js"></script>
	<script src="/js/test.js"></script>
	<!-- <script src="/js/oils.js"></script> -->
	<!-- <script src="/js/formula.js"></script> -->
	<!-- <script src="/js/scripts.js"></script> -->
</body>
</html>