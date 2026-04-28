const response = await fetch("http://localhost:3000/generate-ad", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    adType: "New Listing",
    location: "Phoenix, Arizona",
    address: "Arcadia",
    price: "$650,000",
    audience: "Home Buyers",
    tone: "Luxury",
    details: "3 bed, 2 bath, pool, modern kitchen"
  })
});

const data = await response.json();
console.log(data);