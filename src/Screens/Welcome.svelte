<script>
    import { createEventDispatcher } from 'svelte';
    import { selected } from '../stores/config.js';

    const dispatch = createEventDispatcher();

    export let categories;
    // let selected = [];

    const select = (category) => {
        $selected[category.slug] = true;
        dispatch('select', { category });
    };

    $: renderedCategories = categories.map((d) => {
        return {
            slug: d,
            label: d[0].toUpperCase() + d.slice(1)
        }
    })
</script>

<header>
    <h1>
        CameoP<span class="logo" >a</span>rison
    </h1>

    <p>
        On <a href="https://cameo.com">cameo.com</a>, you can buy personalised video clips from everyone from Lindsay Lohan to Ice T.
    </p>

    <p>But who commands the highest price?</p>
</header>

<p>Pick a category to play a game:</p>

<div class="categories">
    {#each renderedCategories as category}
        <button disabled={$selected[category.slug]} on:click={() => select(category)}>{category.label}</button>
    {/each}
</div>

<style>
    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: min(12vw, 4em);
        font-weight: 100;
        margin: 0 0 0.5em 0;
    }

    p {
        max-width: 24em;
        margin: 0 auto 1em auto;
    }

    .logo {
        display: inline-block;
        background: url('./icons/compare.svg') 50% 50% no-repeat;
        background-size: 100% 100%;
        width: 0.8em;
        top: 0.05em;
        transform: scale(1.4);
        left: 0.02em;
        text-indent: -9999px;
    }

    .categories{
        width: 100%;
        max-width: 26em;
        margin: 0 auto;
    }

    button{
        padding: .5em 1em;
        display: block;
        width: 100%;
    }
    button:hover{
        background-color: rgb(166, 230, 255);
    }

    button:disabled{
        background-color: rgb(205, 218, 224);
    }

    @media(min-width: 640px){
        button{
            display: inline;
            margin: 0 0.2em .4em .2em;
            width: auto;
        }
    }
</style>
