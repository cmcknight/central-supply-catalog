---
title: "Automatons"
layout: "dept-page.njk"
permalink: "/departments/{{ title | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}"
pagination:
  data: "collections.automatons"
  size: 25
  alias: "products"
---

