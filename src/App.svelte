<script>
	import {onMount} from "svelte";

	import Welcome from "./Screens/Welcome.svelte";
	import Game from "./Screens/Game.svelte";
	import {select} from "./select";
	import { load_image} from "./utils";

	import {fullData} from "./stores/data";

	let state = "welcome";//or playing
	let celebs_promise;

	let selection;
	let lookup = new Map();

	$: start =  (e) => {
		selection = select($fullData, lookup, e.detail.category.slug)
		state = "playing";
	}

	$:  $fullData.forEach( c => {
			lookup.set(c.id, c);
		});

	$: categories = $fullData.map(d => d.categories).flat().filter((v, i, a) => a.indexOf(v) === i);

	onMount(() => {
		// celebs_promise = load_celebs();

		load_image("./icons/right.svg");
		load_image("./icons/wrong.svg");
		load_image("./icons/compare.svg");
	});
</script>

<main>


{#if state === "welcome"}
	<Welcome on:select={start} {categories}/>
{:else if state === "playing"}
	<Game {selection} on:restart={() => state = "welcome" }/>
{/if}
</main>
<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 800px;
		margin: 0 auto;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	:global(body){
		background:#000000E5;
		color: white;
	}

</style>