const getNetoApiSettings = async (keys) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(keys, (items) => {
        resolve(items);
      });
    } catch (exception) {
      reject(exception);
    }
  });
};
const getItemCostPrice = async (name) => {
  if (!name || !name.length) {
    return null;
  }

  const netoApiSettings = await getNetoApiSettings([
    "apiUrl",
    "apiUser",
    "apiKey",
  ]);

  const data = {
    method: "POST",
    headers: {
      NETOAPI_USERNAME: netoApiSettings.apiUser,
      NETOAPI_KEY: netoApiSettings.apiKey,
      NETOAPI_ACTION: "GetItem",
      Accept: "application/json",
    },
    body: JSON.stringify({
      Filter: { Name: name, OutputSelector: ["CostPrice"] },
    }),
  };

  const item = await fetch(netoApiSettings.apiUrl, data)
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      return null;
    });

  return item;
};

const writeToHTMLPopup = (totalMargin, inaccurate, error) => {
  const calculationsDiv = document.getElementsByClassName("calculations")[0];
  const spinnerLoaderDiv = document.getElementsByClassName("spinner")[0];
  calculationsDiv.removeChild(spinnerLoaderDiv);

  const marginSpan = document.createElement("span");

  if (!error || !error.length) {
    marginSpan.appendChild(document.createTextNode(totalMargin));
  } else {
    marginSpan.appendChild(document.createTextNode("0%"));
  }

  const marginDiv = document.createElement("div");
  marginDiv.classList.add("margin", "animated");
  marginDiv.appendChild(marginSpan);

  const accuracyIconSpan = document.createElement("span");
  const accuracyTextSpan = document.createElement("span");
  accuracyIconSpan.classList.add("material-icons", "status-icon");

  if (error === "noItems") {
    accuracyIconSpan.classList.add("status-inaccurate");
    accuracyIconSpan.appendChild(document.createTextNode("error"));
    accuracyTextSpan.appendChild(document.createTextNode("No items in POS"));
  } else if (error === "apiError") {
    accuracyIconSpan.classList.add("status-inaccurate");
    accuracyIconSpan.appendChild(document.createTextNode("error"));
    accuracyTextSpan.appendChild(
      document.createTextNode("Please check your NETO API settings")
    );
  } else {
    if (inaccurate) {
      accuracyIconSpan.classList.add("status-inaccurate");
      accuracyIconSpan.appendChild(document.createTextNode("error"));
      accuracyTextSpan.appendChild(
        document.createTextNode(
          "May be inaccurate due to an unpopulated cost price"
        )
      );
    } else {
      accuracyIconSpan.classList.add("status-accurate");
      accuracyIconSpan.appendChild(document.createTextNode("check_circle"));
      accuracyTextSpan.appendChild(document.createTextNode("Accurate"));
    }
  }

  const accuracyDiv = document.createElement("div");
  accuracyDiv.classList.add("accuracy", "animated");
  accuracyDiv.appendChild(accuracyIconSpan);
  accuracyDiv.appendChild(accuracyTextSpan);
  calculationsDiv.appendChild(marginDiv);
  calculationsDiv.appendChild(accuracyDiv);
};

const calculateProfitMargin = (calculationData) => {
  let costPriceTotal = 0;
  let inaccurate = false;
  calculationData.items.forEach((item) => {
    if (item.costPrice == 0 && !inaccurate) {
      inaccurate = true;
    }
    costPriceTotal += item.costPrice * item.quantity;
  });
  const profitMargin = (
    ((calculationData.total - costPriceTotal) / calculationData.total) *
    100
  ).toFixed(2);
  writeToHTMLPopup(`${profitMargin}%`, inaccurate);
};

const handleListItems = (listItems) => {
  if (listItems.origin === "salesOrder") {
    if (listItems.margin === "NaN%") {
      writeToHTMLPopup(null, null, "noItems");
      return;
    }

    writeToHTMLPopup(listItems.margin, listItems.inaccurate);
    return;
  }

  if (!listItems.items || !listItems.items.length) {
    writeToHTMLPopup(null, null, "noItems");
    return;
  }

  const get = async () => {
    return Promise.all(
      listItems.items.map(async (listItem) => {
        const response = await getItemCostPrice(listItem.name);

        if (!response || response.Ack !== "Success") {
          writeToHTMLPopup(null, null, "apiError");
        }

        return {
          ...listItem,
          costPrice: response.Item.length
            ? parseFloat(response.Item[0].CostPrice)
            : 0,
        };
      })
    );
  };

  get().then((items) => {
    calculateProfitMargin({ total: listItems.total, items: items });
  });
};

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, null, handleListItems);
});
