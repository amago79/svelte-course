import { readable, derived } from 'svelte/store';

const url = "https://cameo-explorer.netlify.app/celebs.json";

export const jsonCelebs =  readable({}, async set => {
    const response = await fetch(url)
    const data = await response.json()
    set({entries : data});
    
});

export const fullData = derived(jsonCelebs, $rawData => {
    const {entries = []} = $rawData;
    return entries;

})

export const subset = derived(jsonCelebs, $rawData=> {
    const {entries = []} = $rawData;
     const filter = entries.filter(d => d.reviews > 50);
    return filter;

})