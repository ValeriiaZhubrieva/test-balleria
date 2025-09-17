const catalogBrands = document.querySelectorAll(".catalog__brands");
if (catalogBrands.length) {
  catalogBrands.forEach((catalogBrand) => {
    const catalogBrandMoreBtn = catalogBrand.querySelector(".catalog__brands-more");
    catalogBrandMoreBtn.addEventListener("click", () => {
      catalogBrand.classList.toggle("is-open");
    });
  });
}
const catalogBtnGrid = document.querySelector(".catalog__grids-big");
const catalogBtnRow = document.querySelector(".catalog__grids-small");
const catalogItems = document.querySelector(".catalog__items");
if (catalogBtnGrid && catalogBtnRow && catalogItems) {
  catalogBtnRow.addEventListener("click", () => {
    catalogItems.classList.add("items-grid-small");
    catalogBtnRow.classList.add("is-active");
    catalogBtnGrid.classList.remove("is-active");
  });
  catalogBtnGrid.addEventListener("click", () => {
    catalogItems.classList.remove("items-grid-small");
    catalogBtnRow.classList.remove("is-active");
    catalogBtnGrid.classList.add("is-active");
  });
}
const filtersBlock = document.querySelectorAll("[data-filters-block]");
if (filtersBlock.length) {
  filtersBlock.forEach((block) => {
    const filterItems = block.querySelectorAll(".filters-block__item");
    filterItems.forEach((item) => {
      const itemToggle = item.querySelector(".filters-block__toggle");
      if (item.classList.contains("is-open")) {
        itemToggle.classList.add("is-active");
      }
      itemToggle.addEventListener("click", () => {
        item.classList.toggle("is-open");
        itemToggle.classList.toggle("is-active");
      });
    });
  });
}
