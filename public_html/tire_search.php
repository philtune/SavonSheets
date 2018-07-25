<title>RideDirect</title>
<style>
.m_tire_search {
padding: 40px 64px;
	> .container {
		max-width: 1280px;
		margin: 0 auto;
	}
}
.c_tire_search {
	border: 1px solid black;
	display: flex;
}
	.c_tire_search-filter {
		border-right: 1px solid black;
		flex: 0 0 25%;
	}
	.c_tire_search-results {
		flex: 0 0 75%;
		padding: 24px 40px;
	}
	.filters {
		display: flex;
		flex-direction: column;
	}
	.filters-filter {}
	.filters-filter .heading {
		padding: 24px 40px;
		border-bottom: 1px solid black;
	}
	.filters-filter:not(:first-child) .heading {
		border-top: 1px solid black;
	}
	.filters-filter .content {
		padding: 24px 40px;
	}
</style>
<div class="m_tire_search" data-control="tire_search">
	<div class="container">

		<div class="c_tire_search">
			<div class="c_tire_search-filter">
				<div class="filters">
					<div class="filters-filter">
						<div class="heading">Search by Vehicle</div>
						<div class="content">
							abcd<br/>
							efgh
						</div>
					</div>
					<div class="filters-filter">
						<div class="heading">Search by Size</div>
						<div class="content">
							abcd<br/>
							efgh
						</div>
					</div>
				</div>
			</div>
			<div class="c_tire_search-results">
				abcd<br/>
				efgh<br/>
			</div>
		</div>

	</div>
</div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
<script>
	$('[data-control="tire_search"]').each(function(){
		console.log(this);
	});
</script>