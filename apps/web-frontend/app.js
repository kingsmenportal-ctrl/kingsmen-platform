(function () {
  "use strict";
  const packages = [
    {name:"Foundational Accord",tier:"All pathways",price:169.99,applications:5,capacity:4,accommodation:8,description:"A practical starting point for organised application support."},
    {name:"Collegiate Ordinance",tier:"Higher education",price:299.99,applications:10,capacity:8,description:"More priority application volume for study routes."},
    {name:"Chancellor’s Writ",tier:"Education support",price:399.99,applications:15,capacity:10,description:"Expanded managed-route capacity for ambitious plans.",featured:true},
    {name:"Regency Mandate",tier:"Premium support",price:469.99,applications:15,capacity:12,description:"Higher managed capacity for a broader application plan."},
    {name:"Artisan Charter",tier:"Skills & trades",price:149.99,applications:5,capacity:3,description:"Focused support for technical and trade pathways."},
    {name:"Guildmasters Charter",tier:"Skills & career",price:199.99,applications:8,capacity:5,description:"Additional priority applications and managed capacity."},
    {name:"CV Revamp",tier:"Standalone service",price:49.99,applications:0,capacity:0,description:"A CV and motivation-letter preparation service.",cv:true},
    {name:"Free Destiny Map",tier:"Free preview",price:0,applications:0,capacity:0,description:"Explore a starting route before choosing paid support.",free:true}
  ];
  const money = value => new Intl.NumberFormat("en-ZA", {style:"currency",currency:"ZAR"}).format(value);
  const grid = document.getElementById("package-grid");
  if (grid) {
    grid.innerHTML = packages.map(p => {
      const features = p.cv
        ? ["15 CV versions + 15 motivation letters","Target turnaround: 3 business days","No managed-route capacity included"]
        : p.free
          ? ["Explore the six pathways","Public preview only","No live applications or payments"]
          : [p.applications + " priority applications",p.capacity + " concurrent managed routes / 30-day capacity",p.accommodation + " accommodation routes included"];
      return '<article class="package-card' + (p.featured ? ' featured' : '') + '">' +
        (p.featured ? '<span class="package-badge">FEATURED</span>' : '') +
        '<span class="package-tier">' + p.tier + '</span><h3>' + p.name + '</h3>' +
        '<div class="package-price">' + money(p.price) + (p.price > 0 && !p.cv ? '<small> / package</small>' : '') + '</div>' +
        '<p class="package-description">' + p.description + '</p><ul class="package-features">' +
        features.map(f => '<li>' + f + '</li>').join('') +
        '</ul><a class="button ' + (p.featured ? 'button-gold' : 'button-ghost') + '" href="#destiny-map" data-package="' + p.name + '">' +
        (p.free ? 'Explore for free' : p.cv ? 'Explore CV service' : 'View support options') + ' <span aria-hidden="true">→</span></a></article>';
    }).join("");
    grid.querySelectorAll("[data-package]").forEach(link => link.addEventListener("click", () => {
      const result = document.getElementById("destiny-result");
      if (result) {
        result.hidden = false;
        result.textContent = link.dataset.package + " selected for review. Checkout is not connected in this preview; no order or payment has been created.";
      }
    }));
  }
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    }));
  }
  const form = document.getElementById("destiny-form");
  if (form) form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const goal = String(data.get("goal"));
    const province = String(data.get("province"));
    const education = String(data.get("education"));
    const result = document.getElementById("destiny-result");
    const route = goal === "Help me decide" ? "a guided pathway review" : goal;
    result.hidden = false;
    result.textContent = "Preview route: start with " + route + " in " + province + ". Your education level is recorded only in this page session as " + education + ". No data was sent, no account was created and no application was submitted.";
    result.scrollIntoView({behavior:"smooth",block:"nearest"});
  });
})();