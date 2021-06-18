const getPosInfo = () => {
  let listItemsFromDOM = document.getElementsByClassName("list-item");

  if (!listItemsFromDOM) {
    sendResponse({ items: null, total: null });
    return;
  }

  listItemsFromDOM = [].slice.call(listItemsFromDOM);
  listItemsFromDOM = listItemsFromDOM.splice(
    0,
    Math.ceil(listItemsFromDOM.length / 2)
  );

  const listItems = listItemsFromDOM.map((listItemFromDOM) => {
    return {
      quantity: parseInt(listItemFromDOM.childNodes[0].innerText),
      name: listItemFromDOM.childNodes[1].childNodes[0].innerText,
      price: parseFloat(
        listItemFromDOM.childNodes[1].childNodes[1].innerText
          .replace("$", "")
          .replace(",", "")
      ),
    };
  });

  const checkoutButton = document.getElementsByClassName("checkout-button")[0];
  if (!checkoutButton) {
    sendResponse({ items: null, total: null });
    return;
  }

  let total = parseFloat(
    checkoutButton.childNodes[0].childNodes[0].innerText
      .replace("$", "")
      .replace(",", "")
      .replace("\n", "")
      .replace("Pay now", "")
      .replace("arrow_forward", "")
  );

  const tax = parseFloat(
    document
      .getElementsByClassName("total-tax")[0]
      .innerText.replace("$", "")
      .replace(",", "")
  );

  total = total - tax;
  return { items: listItems, total: total, origin: "pos" };
};

const getSalesOrderInfo = () => {
  const costPriceDiv = document.getElementsByClassName("info");
  let inaccurate = false;
  let costPrices = [];

  for (let tr of costPriceDiv) {
    tr.querySelectorAll("span").forEach((node) => {
      if (node.id.includes("itmcst")) {
        costPrices.push(parseFloat(node.innerText));
      }
    });
  }

  let detailsDiv = document.getElementById("orderlist");

  detailsDiv = detailsDiv.childNodes[1];

  let count = 0;

  for (let tr of detailsDiv.childNodes) {
    if (tr.id.includes("itmrow")) {
      const quantity = parseInt(tr.childNodes[2].childNodes[0].value);
      if (!Number.isNaN(quantity)) {
        if (costPrices[count] === 0) {
          inaccurate = true;
        }
        costPrices[count] *= quantity;
        count++;
      }
    }
  }

  let grandTotal = parseFloat(document.getElementById("ordgantotal").innerText);

  grandTotal =
    grandTotal - parseFloat(document.getElementById("ordtaxtotal").innerText);

  const costPriceTotal = costPrices.reduce((a, b) => a + b, 0);

  const finalMargin = (
    ((grandTotal - costPriceTotal) / grandTotal) *
    100
  ).toFixed(2);

  return {
    margin: `${finalMargin}%`,
    inaccurate: inaccurate,
    origin: "salesOrder",
  };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    window.location.pathname.includes("_cpanel/salesorder/view") ||
    window.location.pathname.includes("_cpanel/order/vieworder")
  ) {
    sendResponse(getSalesOrderInfo());
  } else {
    sendResponse(getPosInfo());
  }
});